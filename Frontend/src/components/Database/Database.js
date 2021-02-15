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

  fetchById(id) {
    return this.database.get(id);
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

  fetchItemById(id) {
    return this.findCached({
      selector: this.selectorBuilder().withDocType("item").withField("id").equals(id).build(),
    });
  }

  fetchCustomerById(id) {
    return this.findCached({
      selector: this.selectorBuilder().withDocType("item").withField("id").equals(id).build(),
    });
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
    const cacheKey = JSON.stringify(options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    } else {
      // first get all ids to know the count (for pagination)
      const allIds = await this.findCached({
        sort: sortBy,
        limit: 9999999,
        fields: ["_id"],
        selector: {
          $and: selectors,
        },
      }).then((result) => result.docs.map((doc) => doc._id));

      // then get all docs of current page
      const docsForPage = await this.database
        .allDocs({
          include_docs: true,
          keys: allIds.slice(skip, skip + rowsPerPage),
        })
        .then((result) => result.rows.map((entry) => entry.doc));

      const result = {
        docs: docsForPage,
        count: allIds.length,
      };
      this.cache.set(cacheKey, result);
      return result;
    }
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
      selectors.push(this.selectorsForSearchTerm(searchTerm, docType));
    }

    await this.createAllViews();

    // query with selectors and sort
    const result = await this.docsMatchingAllSelectorsSortedBy({
      selectors,
      sortBy: [{ [sortBy]: sortReverse ? "desc" : "asc" }],
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

  async fetchUniqueCustomerFieldValues(field, startsWith) {
    const fieldValues = await this.findCached({
      limit: 100,
      fields: [field],
      selector: this.selectorBuilder()
        .withDocType("customer")
        .withField(field)
        .startsWithIgnoreCase(startsWith)
        .build(),
    }).then((result) => result.docs.map((doc) => doc[field].trim().replace("ß", "ss")));
    return Array.from(new Set(fieldValues));
  }

  selectorsForSearchTerm(searchTerm, docType) {
    const formattedSearchTerm = searchTerm.toLowerCase();
    const searchTermWords = formattedSearchTerm
      .split(" ")
      .map((searchTerm) => searchTerm.trim())
      .filter((searchTerm) => searchTerm !== "");

    const selectorsForSearchWord = (searchWord) => {
      return columnsToSearch(!isNaN(searchWord)).map((column) => ({
        [column.key]: {
          $regex: "(?i)" + (column?.search === "from_beginning" ? "^(0+?)?" : "") + searchWord,
        },
      }));
    };

    const columnsToSearch = (numericSearchTerm = false) => {
      return COLUMNS[docType]
        .filter(
          (column) =>
            (!numericSearchTerm && !column.numeric) || (numericSearchTerm && column.numeric)
        )
        .filter((column) => !column.search || column.search !== "exclude");
    };

    return {
      $and: searchTermWords.map((searchTermWord) => ({
        $or: selectorsForSearchWord(searchTermWord),
      })),
    };
  }

  async createAllViews() {
    let createDesignDocPromises = [];
    [...customerColumns, ...itemColumns, ...rentalColumns].forEach((column) => {
      createDesignDocPromises.push(
        this.database.createIndex({
          index: {
            fields: [column.key],
          },
        })
      );
    });
    await Promise.all(createDesignDocPromises);
  }
}

export default new Database();
