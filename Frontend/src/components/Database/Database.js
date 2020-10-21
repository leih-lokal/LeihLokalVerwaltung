import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
PouchDB.plugin(PouchDBFind);

class Database {
  database;
  remoteDatabase;
  changeCallback;
  syncHandler;
  replicationHandler;
  cacheInBrowser;
  name;

  constructor(name, cacheInBrowser = false) {
    this.cacheInBrowser = cacheInBrowser;
    this.changeCallback = (updatedDocs) => {};
    this.name = name;
  }

  connect() {
    this.remoteDatabase = new PouchDB(
      `${process.env.COUCHDB_SSL ? "https" : "http"}://${
        process.env.COUCHDB_USER
      }:${localStorage.getItem("password")}@${process.env.COUCHDB_HOST}/${this.name}`
    );

    if (this.cacheInBrowser) {
      this.database = new PouchDB(name);
    } else {
      this.database = this.remoteDatabase;
    }

    return this.remoteDatabase.info();
  }

  fetchAllDocs() {
    return this.database
      .allDocs({ include_docs: true })
      .then((docs) => docs.rows.map((row) => row.doc));
  }

  fetchById(id) {
    return this.database.get(id);
  }

  updateDoc(updatedDoc) {
    return this.database.get(updatedDoc._id).then((doc) => {
      updatedDoc._rev = doc._rev;
      return this.createDoc(updatedDoc);
    });
  }

  createDoc(doc) {
    return this.database.put(doc);
  }

  createDocWithoutId(doc) {
    return this.database.post(doc);
  }

  removeDoc(doc) {
    return this.database.remove(doc._id, doc._rev);
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

export default Database;
