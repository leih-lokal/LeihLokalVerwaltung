import PouchDB from "pouchdb-browser";

class Database {
  #customerDb;

  constructor() {
    this.#customerDb = new PouchDB(
      `http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@${process.env.COUCHDB_HOST}/customers`
    );
  }

  fetchAllCustomers() {
    return this.#customerDb
      .allDocs({ include_docs: true })
      .then((docs) => docs.rows.map((row) => row.doc));
  }

  updateCustomer(updatedCustomer) {
    return this.#customerDb.get(updatedCustomer._id).then((doc) => {
      updatedCustomer._rev = doc._rev;
      return this.#customerDb.put(updatedCustomer);
    });
  }

  onCustomerChange(callback) {
    return new Promise((resolve, reject) => {
      this.#customerDb
        .changes({
          since: "now",
          live: true,
          include_docs: true,
        })
        .on("change", callback)
        .on("error", (error) => reject(error));
    });
  }
}

export default new Database();
