import Database from "../../src/components/Database/Database";
import PouchDB from "pouchdb-browser";
import customers from "./DummyData/customers";

class DummyDatabase extends Database {
  async connect() {
    this.database = new PouchDB(this.name);
    if (this.name === "customers") {
      await this.database.bulkDocs(customers);
    }
  }

  // https://github.com/pouchdb/pouchdb/issues/6274
  selectorsForSearchWord(searchWord) {
    return this.columnsToSearch(!isNaN(searchWord)).map((column) => ({
      [column.key]: {
        $regex: new RegExp((column?.search === "from_beginning" ? "^(0+)?" : "") + searchWord, "i"),
      },
    }));
  }
}

export default DummyDatabase;
