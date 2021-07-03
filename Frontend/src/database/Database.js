import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import Cache from "lru-cache";
import SelectorBuilder from "./SelectorBuilder";
import { get } from "svelte/store";
import { settingsStore } from "../utils/settingsStore";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  changeListener;
  onConnectedCallback;

  constructor() {
    // cache for query that returns docs on a page
    this.queryPaginatedDocsCache = new Cache(50);
    // cache for other queries
    this.cache = new Cache(50);
  }

  connect() {
    if (this.changeListener) {
      this.changeListener.cancel();
    }
    this.cache.reset();
    this.queryPaginatedDocsCache.reset();
    const settings = get(settingsStore);
    this.database = new PouchDB(
      `http${settings.couchdbHTTPS ? "s" : ""}://${settings.couchdbUser}:${
        settings.couchdbPassword
      }@${settings.couchdbHost}:${settings.couchdbPort}/${settings.couchdbName}`
    );
    if (this.onConnectedCallback) this.onConnectedCallback();
  }

  onConnected(onConnectedCallback) {
    this.onConnectedCallback = onConnectedCallback;
  }

  selectorBuilder() {
    return new SelectorBuilder();
  }

  updateDoc(updatedDoc) {
    this.cache.reset();
    return this.database
      .get(updatedDoc._id, {
        revs_info: true,
        conflicts: true,
      })
      .then((doc) =>
        this.database.put({
          _rev: doc._rev,
          last_update: new Date().getTime(),
          ...updatedDoc,
        })
      );
  }

  createDoc(doc) {
    this.cache.reset();
    this.queryPaginatedDocsCache.reset();
    doc["last_update"] = new Date().getTime();
    return this.database.post(doc);
  }

  removeDoc(doc) {
    this.cache.reset();
    return this.database.remove(doc._id, doc._rev);
  }

  fetchByIdAndType(id, type) {
    return this.findCached({
      selector: this.selectorBuilder()
        .withDocType(type)
        .withField("id")
        .equals(parseInt(id))
        .build(),
    }).then((result) => result.docs ?? []);
  }

  async nextUnusedId(docType) {
    const result = await this.findCached({
      fields: ["id"],
      limit: 999999,
      selector: {
        type: {
          $eq: docType,
        },
      },
    });
    return (
      Math.max(...result.docs.map((doc) => doc.id).filter(Number.isInteger)) + 1
    );
  }

  async createView(name, mapFun) {
    try {
      await this.database.put({
        _id: "_design/" + name,
        views: {
          [name]: {
            map: mapFun,
          },
        },
      });
    } catch (err) {
      // ignore if doc already exists
      if (err.name !== "conflict") {
        throw err;
      }
    }
  }

  async createIndex(index) {
    await this.database.createIndex(index);
    this.cache.reset();
    this.queryPaginatedDocsCache.reset();
  }

  async docsMatchingAllSelectorsSortedBy(options) {
    const { selectors, sortBy, rowsPerPage, skip } = options;

    // get docs of page
    const docsOfPage = await this.findCached({
      sort: sortBy,
      limit: rowsPerPage,
      skip: skip,
      selector: {
        $and: selectors,
      },
    }).then((result) => result.docs);

    // lazy count (for pagination)
    const countPromise = this.findCached({
      sort: sortBy,
      limit: 99999999,
      fields: ["_id"],
      selector: {
        $and: selectors,
      },
    }).then((result) => result.docs.length);

    return {
      docs: docsOfPage,
      count: countPromise,
    };
  }

  _listenForChanges(onDocsChanged) {
    if (this.changeListener) {
      this.changeListener.cancel();
    }
    this.changeListener = this.database
      .changes({
        since: "now",
        live: true,
        include_docs: false,
      })
      .on("change", function (changes) {
        onDocsChanged(changes.doc);
      })
      .on("complete", function (info) {
        console.debug(
          `CouchDb changeListener completed: ${JSON.stringify(info)}`
        );
      })
      .on("error", function (err) {
        console.error(err);
      });
  }

  async query(options, onDocsUpdated) {
    const cacheKey = JSON.stringify(options);
    if (this.queryPaginatedDocsCache.has(cacheKey)) {
      return this.queryPaginatedDocsCache.get(cacheKey);
    }

    const {
      filters,
      sortBy,
      sortReverse,
      rowsPerPage,
      currentPage,
      searchTerm,
      docType,
      columns,
    } = options;

    // filter by filters
    let selectors = filters.flatMap((filter) => filter.selectors);
    selectors.push({
      type: {
        $eq: docType,
      },
    });

    // filter by searchTerm
    if (searchTerm && searchTerm.length > 0) {
      selectors.push(
        this.selectorBuilder().searchTerm(searchTerm, columns).build()
      );
    }

    // query with selectors and sort
    const result = await this.docsMatchingAllSelectorsSortedBy({
      selectors,
      sortBy: sortBy.map((field) => ({
        [field]: sortReverse ? "desc" : "asc",
      })),
      rowsPerPage,
      skip: rowsPerPage * currentPage,
    });
    this.queryPaginatedDocsCache.set(cacheKey, result);

    // callback if doc updated
    this._listenForChanges(() => {
      this.queryPaginatedDocsCache.reset();
      this.cache.reset();
      onDocsUpdated();
    });

    return result;
  }

  fetchAllDocsBySelector(selector, fields) {
    return this.database
      .find({
        limit: 100000,
        fields: fields,
        selector: selector,
      })
      .then((result) => result.docs);
  }

  fetchDocsBySelector(selector, fields) {
    return this.findCached({
      limit: 10,
      fields: fields,
      selector: selector,
    }).then((result) => result.docs);
  }

  async findCached(options) {
    const cacheKey = JSON.stringify(options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const result = await this.database.find(options);
    this.cache.set(cacheKey, result);
    return result;
  }

  async fetchUniqueCustomerFieldValues(field, startsWith, isNumeric = false) {
    let selector = this.selectorBuilder()
      .withDocType("customer")
      .withField(field);

    if (isNumeric) {
      selector = selector.numericFieldStartsWith(startsWith).build();
    } else {
      selector = selector.startsWithIgnoreCase(startsWith).build();
    }

    const docs = await this.findCached({
      limit: 100,
      fields: [field],
      selector,
    })
      .then((result) => result.docs)
      .then((docs) => {
        if (isNumeric) {
          return docs;
        } else {
          return docs.map((doc) => ({
            [field]: doc[field].trim().replace("ß", "ss"),
          }));
        }
      });
    const uniqueValues = new Set();
    docs.forEach((doc) => {
      uniqueValues.add(doc[field]);
    });
    return Array.from(uniqueValues).map((uniqueValue) => ({
      [field]: uniqueValue,
    }));
  }
}

export default new Database();
