import Database from "./Database";
import PouchDB from "pouchdb-browser";
import customers from "../../../spec/Database/DummyData/customers";
import items from "../../../spec/Database/DummyData/items";
import rentals from "../../../spec/Database/DummyData/rentals";
import LocalSelectorBuilder from "./LocalSelectorBuilder";

const TEST_DATA = {
  customers: customers,
  items: items,
  rentals: rentals(),
};

class LocalDatabase extends Database {
  async connect() {
    this.database = new PouchDB(this.name);
    await this.database.bulkDocs(TEST_DATA[this.name]);
  }

  // https://github.com/pouchdb/pouchdb/issues/6274
  selectorsForSearchWord(searchWord) {
    return this.columnsToSearch(!isNaN(searchWord)).map((column) => ({
      [column.key]: {
        $regex: new RegExp(
          (column?.search === "from_beginning" ? "^(0+?)?" : "") + searchWord,
          "i"
        ),
      },
    }));
  }

  selectorBuilder() {
    return new LocalSelectorBuilder();
  }
}

export default LocalDatabase;
