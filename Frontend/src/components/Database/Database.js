import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { hashString } from "../../utils/utils";
import Cache from "lru-cache";
import SelectorBuilder from "./SelectorBuilder";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  syncHandler;
  columns;
  existingDesignDocIds;
  cache;

  constructor(name, columns) {
    this.columns = columns;
    this.name = name;
    this.existingDesignDocIds = new Set();
    this.cache = new Cache(50);
  }

  connect() {
    this.cache.reset();
    this.database = new PouchDB(
      `https://${localStorage.getItem("couchdbUser")}:${localStorage.getItem(
        "couchdbPassword"
      )}@${localStorage.getItem("couchdbHost")}:${localStorage.getItem("couchdbPort")}/${this.name}`
    );

    //create indices for searching
    Promise.all(
      [...this.columnsToSearch(true), ...this.columnsToSearch(false)].map((col) =>
        this.database.createIndex({
          index: { fields: [col.key] },
        })
      )
    );
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
    return this.fetchById(updatedDoc._id).then((doc) => {
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
    if (this.cache.has(JSON.stringify(options))) {
      return this.cache.get(JSON.stringify(options));
    }

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

    const resultDocs = await this.database.allDocs({
      skip: rowsPerPage * currentPage,
      limit: rowsPerPage,
      include_docs: true,
      keys: sortedFilteredIds,
    });

    const result = {
      rows: resultDocs.rows.map((row) => row.doc),
      count: sortedFilteredIds.length,
    };

    this.cache.set(JSON.stringify(options), result);
    return result;
  }

  async fetchDocsBySelector(selector, fields) {
    const result = await this.database.find({
      limit: 10,
      fields: fields,
      selector: selector,
    });
    return result.docs;
  }

  async fetchUniqueDocsBySelector(selector, fields) {
    const result = await this.database.find({
      limit: 100,
      fields: fields,
      selector: selector,
    });
    const docs = [];
    for (let doc of result.docs) {
      doc = doc[fields[0]].trim();
      doc = doc.replace("ß", "ss");
      docs.push(doc);
    }
    const unique = new Set(docs);
    const arr = [];
    for (const val of unique) {
      const obj = {};
      obj[fields[0]] = val;
      arr.push(obj);
    }
    return arr;
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

  async createAllViews() {
    await this.createDesignDoc(
      "customers",
      `function (doc) {
        if(doc.type === "customer"){
          emit(doc);
        }
      }`
    );
  }
}

export default Database;
