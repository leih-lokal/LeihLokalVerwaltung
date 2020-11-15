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
}

export default DummyDatabase;
