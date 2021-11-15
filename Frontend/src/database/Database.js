import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import Cache from "lru-cache";
import SelectorBuilder from "./SelectorBuilder";
import { get } from "svelte/store";
import { settingsStore } from "../utils/settingsStore";
import Logger from "js-logger";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  changeListeners = {};
  onConnectedCallback;

  constructor() {
    // cache for query that returns docs on a page
    this.queryPaginatedDocsCache = new Cache(50);
    // cache for other queries
    this.cache = new Cache(50);
  }

  cancelAllListeners() {
    for (const [listenForDocType, listener] of Object.entries(
      this.changeListeners
    )) {
      listener.cancel();
    }
  }

  connect() {
    this.cancelAllListeners();
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

  async updateDoc(updatedDoc, updateRev = true) {
    this.cache.reset();
    let rev = updatedDoc._rev;
    if (updateRev) {
      rev = await this.database
        .get(updatedDoc._id, {
          revs_info: true,
          conflicts: true,
        })
        .then((doc) => doc._rev);
    }
    let updatedDocWithRev = {
      last_update: new Date().getTime(),
      ...updatedDoc,
      _rev: rev,
    };
    Logger.debug(`Updated doc ${JSON.stringify(updatedDocWithRev)}`);
    return this.database.put(updatedDocWithRev);
  }

  createDoc(doc) {
    this.cache.reset();
    this.queryPaginatedDocsCache.reset();
    doc["last_update"] = new Date().getTime();
    Logger.debug(`Created doc: ${JSON.stringify(doc)}`);
    return this.database.post(doc);
  }

  removeDoc(doc) {
    this.cache.reset();
    Logger.debug(`Removed doc: ${JSON.stringify(doc)}`);
    return this.database.remove(doc._id, doc._rev);
  }

  fetchByType(type, forceRefreshCache = false) {
    return this.findCached(
      {
        selector: this.selectorBuilder().withDocType(type).build(),
      },
      forceRefreshCache
    ).then((result) => result.docs ?? []);
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

  async createView(name, mapFun, reduceFun) {
    try {
      await this.database.put({
        _id: "_design/" + name,
        views: {
          [name]: {
            map: mapFun,
            ...(reduceFun && { reduce: reduceFun }),
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

  async queryView(name, options = {}) {
    return this.database.query(name, options);
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

  cancelListenerForDocType(docType) {
    if (this.changeListeners[docType]) {
      this.changeListeners[docType].cancel();
    }
  }

  async listenForChanges(onDocsChanged, docType) {
    await this.database
      .put({
        _id: "_design/filterbytype",
        filters: {
          filterbytype: function (doc, req) {
            return doc.type === req.query.type || doc._deleted === true;
          }.toString(),
        },
      })
      .catch((error) => {
        // ignore document update conflicts (when already exists)
        if (error.status !== 409) {
          Logger.error("Failed to create design doc for change filter", error);
        }
      });

    this.cancelListenerForDocType(docType);
    this.changeListeners[docType] = this.database
      .changes({
        since: "now",
        live: true,
        include_docs: false,
        filter: "filterbytype",
        query_params: { type: docType },
      })
      .on("change", onDocsChanged)
      .on("complete", function (info) {
        Logger.debug(
          `CouchDb changeListener completed: ${JSON.stringify(info)}`
        );
      })
      .on("error", Logger.error);
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
    this.listenForChanges(() => {
      this.queryPaginatedDocsCache.reset();
      this.cache.reset();
      onDocsUpdated();
    }, docType);

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

  async findCached(options, forceRefresh = false) {
    const cacheKey = JSON.stringify(options);
    if (!forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    //this.database.explain(options).then(console.log);
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
