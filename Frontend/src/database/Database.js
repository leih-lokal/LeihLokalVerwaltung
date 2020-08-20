import PouchDB from "pouchdb-browser";

class Database {
  database;

  constructor(name) {
    this.database = new PouchDB(
      `http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@${process.env.COUCHDB_HOST}/${name}`
    );
  }

  fetchAllDocs() {
    return this.database
      .allDocs({ include_docs: true })
      .then((docs) => docs.rows.map((row) => row.doc));
  }

  updateDoc(updatedDoc) {
    return this.database.get(updatedDoc._id).then((doc) => {
      updatedDoc._rev = doc._rev;
      return this.database.put(updatedDoc);
    });
  }

  onDocChange(callback) {
    return new Promise((resolve, reject) => {
      this.database
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

export default Database;
