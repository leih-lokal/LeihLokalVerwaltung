import testdata from "../../../spec/Database/testdata";
import customerColumns from "../TableEditors/Customers/Columns";
import rentalColumns from "../TableEditors/Rentals/Columns";
import itemColumns from "../TableEditors/Items/Columns";
import SelectorBuilder from "./SelectorBuilder";

const COLUMNS = {
  customer: customerColumns,
  item: itemColumns,
  rental: rentalColumns,
};

class LocalDatabase {
  constructor() {
    this.data = testdata();
  }

  async connect() {}

  matchesSelector(doc, selector) {
    for (const [selectorKey, selectorObj] of Object.entries(selector)) {
      if (!selector.hasOwnProperty(selectorKey)) {
        continue;
      }
      if (selectorKey === "$or") {
        return selectorObj.some((innerSelector) => this.matchesSelector(doc, innerSelector));
      } else if (selectorKey === "$and") {
        return selectorObj.every((innerSelector) => this.matchesSelector(doc, innerSelector));
      } else {
        let comparator = Object.keys(selectorObj)[0];
        let value = doc[selectorKey];
        let compareToValue = selectorObj[comparator];

        if (comparator === "$eq") {
          return value === compareToValue;
        } else if (comparator === "$ne") {
          return value !== compareToValue;
        } else if (comparator === "$gte") {
          return value >= compareToValue;
        } else if (comparator === "$gt") {
          return value > compareToValue;
        } else if (comparator === "$lte") {
          return value <= compareToValue;
        } else if (comparator === "$lt") {
          return value < compareToValue;
        } else if (comparator === "$exists") {
          return (typeof value !== "undefined") === compareToValue;
        } else if (comparator === "$regex") {
          if (compareToValue.startsWith("(?i)")) {
            compareToValue = new RegExp(compareToValue.replaceAll("(?i)", ""), "i");
          }
          return value && value.match(compareToValue);
        } else {
          console.warn("unknown comparator: " + comparator);
          return false;
        }
      }
    }
  }

  async fetchItemById(id) {
    let docs = this.data.filter((doc) => doc.type === "item" && doc.id === id);
    return docs.length > 0 ? docs[0] : {};
  }

  async fetchCustomerById(id) {
    let docs = this.data.filter((doc) => doc.type === "customer" && doc.id === id);
    return docs.length > 0 ? docs[0] : {};
  }

  async query(options) {
    let { filters, sortBy, sortReverse, rowsPerPage, currentPage, searchTerm, docType } = options;

    let columns = COLUMNS[docType];

    let selectors = filters.flatMap((filter) => filter.selectors);
    selectors.push({
      type: {
        $eq: docType,
      },
    });

    // filter
    let dataMatchingFilter = this.data.filter((doc) =>
      this.matchesSelector(doc, { $and: selectors })
    );
    searchTerm = searchTerm.trim().toLowerCase();
    if (searchTerm.length > 0) {
      dataMatchingFilter = dataMatchingFilter.filter((doc) =>
        searchTerm.split(" ").every((searchWord) =>
          Object.entries(doc)
            .filter(([key, value]) => columns.find((col) => col.key === key))
            .filter(([key, value]) => columns.find((col) => col.key === key).search !== "exclude")
            .filter(
              ([key, value]) =>
                (columns.find((col) => col.key === key).numeric && !isNaN(searchWord)) ||
                (!columns.find((col) => col.key === key).numeric && isNaN(searchWord))
            )
            .some(([key, value]) => String(doc[key]).toLowerCase().includes(searchWord))
        )
      );
    }

    // sort
    let sortedData = dataMatchingFilter.sort(function (a, b) {
      let i = 0;
      let result = 0;
      while (i < sortBy.length && result === 0) {
        result = a[sortBy[i]] < b[sortBy[i]] ? -1 : a[sortBy[i]] > b[sortBy[i]] ? 1 : 0;
        i++;
      }
      if (sortReverse) {
        result *= -1;
      }
      return result;
    });

    // paginate
    let paginatedData = sortedData.slice(
      rowsPerPage * currentPage,
      rowsPerPage * currentPage + rowsPerPage
    );

    return { docs: paginatedData, count: dataMatchingFilter.length };
  }

  async updateDoc(updatedDoc) {
    this.removeDoc(updatedDoc);
    this.createDoc(updatedDoc);
  }

  async removeDoc(docToRemove) {
    this.data = this.data.filter((doc) => doc._id !== docToRemove._id);
  }

  async createDoc(doc) {
    this.data.push(doc);
  }

  async nextUnusedId(docType) {
    let usedIds = this.data.filter((doc) => doc.type === docType).map((doc) => doc.id);
    return Math.max(...usedIds) + 1;
  }

  async fetchDocsBySelector(selector, fields) {
    return this.data
      .filter((doc) => this.matchesSelector(doc, selector))
      .map((doc) => {
        let docWithFields = {};
        fields.forEach((field) => (docWithFields[field] = doc[field]));
        return docWithFields;
      });
  }

  selectorBuilder() {
    return new SelectorBuilder();
  }
}

export default new LocalDatabase();
