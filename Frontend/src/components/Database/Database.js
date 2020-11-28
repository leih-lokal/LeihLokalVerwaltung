import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { hashString } from "../../utils/utils";
import Cache from "lru-cache";
import SelectorBuilder from "./SelectorBuilder";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  changeCallback;
  syncHandler;
  replicationHandler;
  name;
  columns;
  existingDesignDocIds;
  cache;
  host;

  constructor(name, columns, host) {
    this.changeCallback = (updatedDocs) => {};
    this.name = name;
    this.columns = columns;
    this.host = host;
    this.existingDesignDocIds = new Set();
    this.cache = new Cache(50);
  }

  connect() {
    this.database = new PouchDB(
      `http://ENV_COUCHDB_USER:ENV_COUCHDB_PASSWORD@${this.host}/${this.name}`
    );

    const doWithTimeout = (promise, timeoutS = 3) => {
      return new Promise((resolve, reject) => {
        promise.then(resolve, reject);
        setTimeout(
          () => reject(`failed to connect to couchdb host ${this.host} after ${timeoutS}s!`),
          timeoutS * 1000
        );
      });
    };

    //create indices for searching
    Promise.all(
      [...this.columnsToSearch(true), ...this.columnsToSearch(false)].map((col) =>
        this.database.createIndex({
          index: { fields: [col.key] },
        })
      )
    );

    // test connection
    return doWithTimeout(this.database.info()).then(() => {
      this.replicationHandler = this.database
        .changes({
          since: "now",
          live: true,
          include_docs: false,
        })
        .on("change", async (change) => this.cache.reset())
        .on("error", (error) => console.error(error));
    });
  }

  disconnect() {
    if (this.replicationHandler) this.replicationHandler.cancel();
  }

  selectorBuilder() {
    return new SelectorBuilder();
  }

  columnsToSearch(numeric = false) {
    return this.columns
      .filter((column) => (!numeric && !column.numeric) || (numeric && column.numeric))
      .filter((column) => !column.search || column.search !== "exclude");
  }

  fetchById(id) {
    return this.database.get(id);
  }

  updateDoc(updatedDoc) {
    this.cache.reset();
    return this.database.get(updatedDoc._id).then((doc) => {
      updatedDoc._rev = doc._rev;
      return this.createDoc(updatedDoc);
    });
  }

  createDoc(doc) {
    this.cache.reset();
    return this.database.put(doc);
  }

  createDocWithoutId(doc) {
    this.cache.reset();
    return this.database.post(doc);
  }

  removeDoc(doc) {
    this.cache.reset();
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

  async idsMatchingAllSelectors(selectors) {
    const cacheKey = hashString(JSON.stringify(selectors));
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    } else {
      const result = await this.database
        .find({
          fields: ["_id"],
          limit: 999999,
          selector: {
            $and: selectors,
          },
        })
        .then((result) => result.docs.map((doc) => doc._id));
      this.cache.set(cacheKey, result);
      return result;
    }
  }

  async query(options) {
    const { filters, sortBy, sortReverse, rowsPerPage, currentPage, searchTerm } = options;
    const requiredFields = filters.flatMap((filter) => filter.required_fields);
    const ddocId = "query-" + hashString(sortBy);
    let selectors = filters.flatMap((filter) => filter.selectors);
    if (searchTerm && searchTerm.length > 0) {
      selectors = [...selectors, this.selectorsForSearchTerm(searchTerm)];
    }

    let fetchFilteredIdsPromise = Promise.resolve([]);
    if (selectors.length > 0) {
      fetchFilteredIdsPromise = this.createIndexForFields(requiredFields).then(() =>
        this.idsMatchingAllSelectors(selectors)
      );
    }

    const [idsMatchingAllFilters, sortedIds] = await Promise.all([
      fetchFilteredIdsPromise,

      this.createDesignDoc(
        ddocId,
        `function (doc) {
          var transformBeforeSort = ${this.columns
            .find((col) => col.key === sortBy)
            ?.sort?.toString()};
          if(typeof transformBeforeSort === 'undefined'){
            emit(doc.${sortBy});
          }else{
            emit(transformBeforeSort(doc));
          }
        }`
      )
        .then(() =>
          this.database.query(ddocId + "/index", {
            include_docs: false,
            descending: sortReverse,
            limit: 999999,
          })
        )
        .then((result) => result.rows.map((row) => row.id)),
    ]);

    let sortedFilteredIds = sortedIds;
    if (selectors.length > 0) {
      sortedFilteredIds = sortedIds.filter((id) => idsMatchingAllFilters.includes(id));
    }

    const result = await this.database.allDocs({
      skip: rowsPerPage * currentPage,
      limit: rowsPerPage,
      include_docs: true,
      keys: sortedFilteredIds,
    });

    return {
      rows: result.rows.map((row) => row.doc),
      count: sortedFilteredIds.length,
    };
  }

  async fetchDocsBySelector(selector, fields) {
    const result = await this.database.find({
      limit: 10,
      fields: fields,
      selector: selector,
    });
    return result.docs;
  }

  selectorsForSearchTerm(searchTerm) {
    const formattedSearchTerm = searchTerm.toLowerCase();
    const searchTermWords = formattedSearchTerm
      .split(" ")
      .map((searchTerm) => searchTerm.trim())
      .filter((searchTerm) => searchTerm !== "");

    return {
      $and: searchTermWords.map((searchTermWord) => ({
        $or: this.selectorsForSearchWord(searchTermWord),
      })),
    };
  }

  selectorsForSearchWord(searchWord) {
    return this.columnsToSearch(!isNaN(searchWord)).map((column) => ({
      [column.key]: {
        $regex: "(?i)" + (column?.search === "from_beginning" ? "^(0+?)?" : "") + searchWord,
      },
    }));
  }

  async createIndexForFields(fields) {
    const name = hashString(fields.join(","));
    if (!this.existingDesignDocIds.has(name)) {
      await this.database.createIndex({
        index: { fields: fields },
        ddoc: name,
      });
      this.existingDesignDocIds.add(name);
    }
  }
}

export default Database;
