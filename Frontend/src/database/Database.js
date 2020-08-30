import PouchDB from "pouchdb-browser";

class Database {
  database;
  remoteDatabase;
  changeCallback;
  syncHandler;
  replicationHandler;
  cacheInBrowser;

  constructor(name, cacheInBrowser = false) {
    this.cacheInBrowser = cacheInBrowser;
    this.changeCallback = (updatedDocs) => { };

    this.remoteDatabase = new PouchDB(
      `http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@${process.env.COUCHDB_HOST}/${name}`
    );

    if (cacheInBrowser) {
      this.database = new PouchDB(name);
    } else {
      this.database = this.remoteDatabase;
    }
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

  cancelSyncAndChangeListener() {
    if (this.syncHandler) this.syncHandler.cancel();
    if (this.replicationHandler) this.replicationHandler.cancel();
  }

  syncAndListenForChanges() {
    this.cancelSyncAndChangeListener();

    if (this.cacheInBrowser) {
      this.syncHandler = this.database
        .sync(this.remoteDatabase, {
          live: true,
          retry: true,
        })
        .on("error", function (err) {
          console.error(err);
        });
    }

    this.replicationHandler = this.database
      .changes({
        since: "now",
        live: true,
        include_docs: true,
      })
      .on("change", async (change) => this.changeCallback(await this.fetchAllDocs()))
      .on("error", (error) => console.error(error));
  }

  onChange(callback) {
    this.changeCallback = callback;
  }
}

export const CustomerDatabase = new Database("customers");
export const ItemDatabase = new Database("items");
export const RentalDatabase = new Database("rentals");
