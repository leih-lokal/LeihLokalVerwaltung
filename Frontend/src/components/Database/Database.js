import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { hashString } from "../../utils/utils";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  remoteDatabase;
  changeCallback;
  syncHandler;
  replicationHandler;
  cacheInBrowser;
  name;
  columns;
  existingDesignDocIds;

  constructor(name, columns, cacheInBrowser = false) {
    this.cacheInBrowser = cacheInBrowser;
    this.changeCallback = (updatedDocs) => {};
    this.name = name;
    this.columns = columns;
    this.existingDesignDocIds = new Set();
  }

  connect() {
    this.remoteDatabase = new PouchDB(
      `${process.env.COUCHDB_SSL ? "https" : "http"}://${
        process.env.COUCHDB_USER
      }:${localStorage.getItem("password")}@${process.env.COUCHDB_HOST}/${this.name}`
    );

    if (this.cacheInBrowser) {
      this.database = new PouchDB(name);
    } else {
      this.database = this.remoteDatabase;
    }

    //create indices for searching
    Promise.all(
      this.columnsToSearch().map((col) =>
        this.database.createIndex({
          index: { fields: [col.key] },
        })
      )
    );

    return this.remoteDatabase.info();
  }

  columnsToSearch() {
    return this.columns.filter((column) => !column.search || column.search !== "exclude");
  }

  fetchById(id) {
    return this.database.get(id);
  }

  updateDoc(updatedDoc) {
    return this.database.get(updatedDoc._id).then((doc) => {
      updatedDoc._rev = doc._rev;
      return this.createDoc(updatedDoc);
    });
  }

  createDoc(doc) {
    return this.database.put(doc);
  }

  createDocWithoutId(doc) {
    return this.database.post(doc);
  }

  removeDoc(doc) {
    return this.database.remove(doc._id, doc._rev);
  }

  async nextUnusedId() {
    const result = await this.database.allDocs({
      include_docs: false,
      limit: 999999,
    });
    return (
      Math.max(
        ...result.rows
          .map((row) => row.id)
          .filter((id) => !isNaN(id))
          .map((id) => parseInt(id))
      ) + 1
    );
  }

  async createDesignDoc(id, mapFun) {
    if (!this.existingDesignDocIds.has(id)) {
      var ddoc = {
        _id: "_design/" + id,
        views: {
          index: {
            map: mapFun,
          },
        },
      };
      try {
        await this.database.put(ddoc);
        this.existingDesignDocIds.add(id);
      } catch (err) {
        if (err.name !== "conflict") {
          throw err;
        } else {
          this.existingDesignDocIds.add(id);
        }
        // ignore if doc already exists
      }
    }
  }

  async query(options) {
    let resultingIds = await this.sortedIdsMatchingAllFilters(
      options.filterFunctions,
      options.sortBy,
      options.sortReverse
    );
    if (options.searchTerm && options.searchTerm.length > 0) {
      const idsMatchingSearchTerm = await this.idsMatchingSearchTerm(options.searchTerm);
      resultingIds = resultingIds.filter((id) => idsMatchingSearchTerm.includes(id));
    }
    return {
      rows: await this.paginatedDocsByIds(resultingIds, options.rowsPerPage, options.currentPage),
      count: resultingIds.length,
    };
  }

  async idsMatchingSearchTerm(searchTerm) {
    const formattedSearchTerm = searchTerm.toLowerCase();
    const searchTermWords = formattedSearchTerm
      .split(" ")
      .map((searchTerm) => searchTerm.trim())
      .filter((searchTerm) => searchTerm !== "");
    const ids = await Promise.all(
      searchTermWords.map((word) => this.idsMatchingAnySelector(this.selectorsForSearchTerm(word)))
    );
    return ids.reduce((a, b) => a.filter((c) => b.includes(c)));
  }

  async idsMatchingAnySelector(selectors) {
    const result = await this.database.find({
      fields: ["_id"],
      limit: 999999,
      selector: {
        $or: selectors,
      },
    });
    return result.docs.map((doc) => doc._id);
  }

  async fetchDocsBySelector(selector, fields) {
    const result = await this.database.find({
      limit: 10,
      fields: fields,
      selector: selector,
    });
    return result.docs;
  }

  async sortedIdsMatchingAllFilters(filterFunctions, sortBy, sortReverse) {
    const ddocId = String(hashString(filterFunctions.toString() + sortBy + sortReverse));
    await this.createDesignDoc(
      ddocId,
      `function (doc) {
        if ([${filterFunctions.toString()}].every(filterFuncion => filterFuncion(doc))) {
          var transformBeforeSort = ${
            this.columns.find((col) => col.key === sortBy)?.sort?.toString() ?? "value => value"
          };
          emit(transformBeforeSort(doc.${sortBy}));
        }
      }`
    );

    try {
      const result = await this.database.query(ddocId + "/index", {
        include_docs: false,
        descending: sortReverse,
        limit: 999999,
      });
      return result.rows.map((row) => row.id);
    } catch (err) {
      console.log(err);
    }
  }

  async paginatedDocsByIds(ids, rowsPerPage, currentPage) {
    try {
      const result = await this.database.allDocs({
        skip: rowsPerPage * currentPage,
        limit: rowsPerPage,
        include_docs: true,
        keys: ids,
      });
      return result.rows.map((row) => row.doc);
    } catch (err) {
      console.log(err);
    }
  }

  selectorsForSearchTerm(searchTerm) {
    return this.columnsToSearch().map((column) => ({
      [column.key]: {
        $regex: "(?i)" + (column?.search === "from_beginning" ? "^(0+)?" : "") + searchTerm,
      },
    }));
  }

  cancelSyncAndChangeListener() {
    if (this.syncHandler) this.syncHandler.cancel();
    if (this.replicationHandler) this.replicationHandler.cancel();
  }

  syncAndListenForChanges() {
    this.cancelSyncAndChangeListener();

    if (this.cacheInBrowser) {
      this.syncHandler = this.database
        .sync(this.remoteDatabase, {
          live: true,
          retry: true,
        })
        .on("error", function (err) {
          console.error(err);
        });
    }

    this.replicationHandler = this.database
      .changes({
        since: "now",
        live: true,
        include_docs: true,
      })
      .on("change", async (change) => this.changeCallback(await this.fetchAllDocs()))
      .on("error", (error) => console.error(error));
  }

  onChange(callback) {
    this.changeCallback = callback;
  }
}

export default Database;
