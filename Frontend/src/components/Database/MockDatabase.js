import testdataLarge from "../../../../TestDataGenerator/testdata.json";
import testdataSmall from "../../../test/integration_cypress/testdata.js";
import customerColumns from "../../config/customer/columns";
import rentalColumns from "../../config/rental/columns";
import itemColumns from "../../config/item/columns";
import SelectorBuilder from "./SelectorBuilder";

const COLUMNS = {
  customer: customerColumns,
  item: itemColumns,
  rental: rentalColumns,
};

class MockDatabase {
  constructor() {
    if (typeof ENV_LARGE_DATASET === "undefined") {
      this.data = testdataSmall();
    } else {
      this.data = testdataLarge.docs;
    }
    this.writeData(this.data);
  }

  async connect() {}

  matchesSelector(doc, selector) {
    for (const [selectorKey, selectorObj] of Object.entries(selector)) {
      if (!selector.hasOwnProperty(selectorKey)) {
        continue;
      }
      if (selectorKey === "$or") {
        return selectorObj.some((innerSelector) =>
          this.matchesSelector(doc, innerSelector)
        );
      } else if (selectorKey === "$and") {
        return selectorObj.every((innerSelector) =>
          this.matchesSelector(doc, innerSelector)
        );
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
            compareToValue = new RegExp(
              compareToValue.replaceAll("(?i)", ""),
              "i"
            );
          }
          return value && value.match(compareToValue);
        } else {
          console.warn("unknown comparator: " + comparator);
          return false;
        }
      }
    }
  }

  async itemWithIdExists(id) {
    let docs = this.getData().filter(
      (doc) => doc.type === "item" && doc.id === id
    );
    return docs.length > 0;
  }

  async fetchRentalByItemAndCustomerIds(itemId, customerId) {
    let docs = this.getData().filter(
      (doc) =>
        doc.type === "rental" &&
        doc.item_id === itemId &&
        doc.customer_id === customerId
    );
    return docs.length > 0 ? docs[0] : {};
  }

  async query(options) {
    let {
      filters,
      sortBy,
      sortReverse,
      rowsPerPage,
      currentPage,
      searchTerm,
      docType,
    } = options;

    let columns = COLUMNS[docType];

    let selectors = filters.flatMap((filter) => filter.selectors);
    selectors.push({
      type: {
        $eq: docType,
      },
    });

    // filter
    let dataMatchingFilter = this.getData().filter((doc) =>
      this.matchesSelector(doc, { $and: selectors })
    );
    searchTerm = searchTerm.trim().toLowerCase();
    if (searchTerm.length > 0) {
      dataMatchingFilter = dataMatchingFilter.filter((doc) =>
        searchTerm.split(" ").every((searchWord) =>
          Object.entries(doc)
            .filter(([key, value]) => columns.find((col) => col.key === key))
            .filter(
              ([key, value]) =>
                columns.find((col) => col.key === key).search !== "exclude"
            )
            .filter(
              ([key, value]) =>
                (columns.find((col) => col.key === key).numeric &&
                  !isNaN(searchWord)) ||
                (!columns.find((col) => col.key === key).numeric &&
                  isNaN(searchWord))
            )
            .some(([key, value]) =>
              String(doc[key]).toLowerCase().includes(searchWord)
            )
        )
      );
    }

    // sort
    let sortedData = dataMatchingFilter.sort(function (a, b) {
      let i = 0;
      let result = 0;
      while (i < sortBy.length && result === 0) {
        result =
          a[sortBy[i]] < b[sortBy[i]]
            ? -1
            : a[sortBy[i]] > b[sortBy[i]]
            ? 1
            : 0;
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

    return {
      docs: paginatedData,
      count: Promise.resolve(dataMatchingFilter.length),
    };
  }

  async updateDoc(updatedDoc) {
    await this.removeDoc(updatedDoc);
    await this.createDoc(updatedDoc);
  }

  async removeDoc(docToRemove) {
    this.writeData(this.getData().filter((doc) => doc._id !== docToRemove._id));
  }

  async createDoc(doc) {
    const makeId = () => {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < 10; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    };

    if (!doc.hasOwnProperty("_id")) {
      doc["_id"] = makeId();
    }
    this.writeData([...this.getData(), doc]);
  }

  async nextUnusedId(docType) {
    let usedIds = this.getData()
      .filter((doc) => doc.type === docType)
      .map((doc) => doc.id);
    return Math.max(...usedIds) + 1;
  }

  async fetchDocsBySelector(selector, fields) {
    return this.getData()
      .filter((doc) => this.matchesSelector(doc, selector))
      .map((doc) => {
        let docWithFields = {};
        fields.forEach((field) => (docWithFields[field] = doc[field]));
        return docWithFields;
      });
  }

  async fetchUniqueCustomerFieldValues(field, startsWith, isNumeric = false) {
    let customers = this.getData().filter(
      (doc) =>
        doc.type === "customer" &&
        doc[field] &&
        String(doc[field]).startsWith(String(startsWith))
    );
    const uniqueValues = new Set();
    customers.forEach((customer) => {
      uniqueValues.add(customer[field]);
    });
    return Array.from(uniqueValues).map((uniqueValue) => ({
      [field]: uniqueValue,
    }));
  }

  fetchAllDocsBySelector(selector, fields) {
    return this.fetchDocsBySelector(selector, fields);
  }

  getData() {
    if (localStorage.hasOwnProperty("data")) {
      return JSON.parse(localStorage.getItem("data"));
    } else {
      return [];
    }
  }

  writeData(data) {
    localStorage.setItem("data", JSON.stringify(data));
  }

  selectorBuilder() {
    return new SelectorBuilder();
  }
}

export default new MockDatabase();
