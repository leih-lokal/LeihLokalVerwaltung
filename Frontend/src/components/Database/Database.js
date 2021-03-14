import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import Cache from "lru-cache";
import SelectorBuilder from "./SelectorBuilder";
import customerColumns from "../TableEditors/Customers/Columns";
import itemColumns from "../TableEditors/Items/Columns";
import rentalColumns from "../TableEditors/Rentals/Columns";
PouchDB.plugin(PouchDBFind);

const COLUMNS = {
  rental: rentalColumns,
  item: itemColumns,
  customer: customerColumns,
};

class Database {
  database;
  existingDesignDocIds;
  cache;

  constructor() {
    this.existingDesignDocIds = new Set();
    this.cache = new Cache(50);
    this.connect();
    this.createAllViews();
  }

  connect() {
    this.cache.reset();
    this.database = new PouchDB(
      `https://${localStorage.getItem("couchdbUser")}:${localStorage.getItem(
        "couchdbPassword"
      )}@${localStorage.getItem("couchdbHost")}:${localStorage.getItem("couchdbPort")}/leihlokal`
    );
  }

  selectorBuilder() {
    return new SelectorBuilder();
  }

  updateDoc(updatedDoc) {
    this.cache.reset();
    return this.fetchById(updatedDoc._id).then((doc) => {
      updatedDoc._rev = doc._rev;
      return this.database.put(updatedDoc);
    });
  }

  createDoc(doc) {
    this.cache.reset();
    return this.database.post(doc);
  }

  removeDoc(doc) {
    this.cache.reset();
    return this.database.remove(doc._id, doc._rev);
  }

  fetchById(id) {
    return this.database.get(id);
  }

  fetchItemById(id) {
    return this.findCached({
      selector: this.selectorBuilder().withDocType("item").withField("id").equals(id).build(),
    }).then((result) => (result.docs && result.docs.length > 0 ? result.docs[0] : {}));
  }

  itemWithIdExists(id) {
    return this.findCached({
      selector: this.selectorBuilder().withDocType("item").withField("id").equals(id).build(),
    }).then((result) => result.docs && result.docs.length > 0);
  }

  fetchCustomerById(id) {
    return this.findCached({
      selector: this.selectorBuilder().withDocType("customer").withField("id").equals(id).build(),
    }).then((result) => (result.docs && result.docs.length > 0 ? result.docs[0] : {}));
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
    return Math.max(...result.docs.map((doc) => doc.id).filter(Number.isInteger)) + 1;
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

  async query(options) {
    const cacheKey = JSON.stringify(options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const { filters, sortBy, sortReverse, rowsPerPage, currentPage, searchTerm, docType } = options;

    // filter by filters
    let selectors = filters.flatMap((filter) => filter.selectors);
    selectors.push({
      type: {
        $eq: docType,
      },
    });

    // filter by searchTerm
    if (searchTerm && searchTerm.length > 0) {
      selectors.push(this.selectorBuilder().searchTerm(searchTerm, COLUMNS[docType]).build());
    }

    // query with selectors and sort
    const result = await this.docsMatchingAllSelectorsSortedBy({
      selectors,
      sortBy: sortBy.map((field) => ({ [field]: sortReverse ? "desc" : "asc" })),
      rowsPerPage,
      skip: rowsPerPage * currentPage,
    });
    this.cache.set(cacheKey, result);
    return result;
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
    let selector = this.selectorBuilder().withDocType("customer").withField(field);

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
          return docs.map((doc) => ({ [field]: doc[field].trim().replace("ß", "ss") }));
        }
      });
    const uniqueValues = new Set();
    docs.forEach((doc) => {
      uniqueValues.add(doc[field]);
    });
    return Array.from(uniqueValues).map((uniqueValue) => ({ [field]: uniqueValue }));
  }

  async createAllViews() {
    let createDesignDocPromises = [];
    const allColumns = [...customerColumns, ...itemColumns, ...rentalColumns];

    // create index for each column for sorting
    allColumns
      .filter((column) => !column.disableSort)
      .forEach((column) => {
        createDesignDocPromises.push(
          this.database.createIndex({
            index: {
              fields: [column.key],
            },
          })
        );
      });

    createDesignDocPromises.push(
      this.database.createIndex({
        index: {
          fields: ["returned_on", "to_return_on", "customer_name"],
        },
      })
    );

    await Promise.all(createDesignDocPromises);
  }
}

export default new Database();
