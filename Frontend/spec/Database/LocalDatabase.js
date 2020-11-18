import Database from "../../src/components/Database/Database";
import PouchDB from "pouchdb-browser";
import customers from "./DummyData/customers";
import items from "./DummyData/items";

const TEST_DATA = {
  customers: customers,
  items: items,
  rentals: [],
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
}

export default LocalDatabase;
