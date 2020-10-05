import PouchDB from "pouchdb-browser";
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

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

  fetchById(id) {
    return this.database.get(id);
  }

  newId() {
    return this.database
      .allDocs({ include_docs: false })
      .then(docs => {
        const ids = docs.rows.map(row => parseInt(row.id))
        return String(Math.max(...ids) + 1);
      })
  }

  fetchByAttribute(attribute, value, ignoreCase = true) {
    const equal = (val1, val2) => {
      if (!val1) val1 = "";
      if (!val2) val2 = "";
      val1 = ignoreCase ? String(val1).toLocaleLowerCase() : String(val1);
      val2 = ignoreCase ? String(val2).toLocaleLowerCase() : String(val2);
      return val1 === val2;
    }

    return this.fetchAllDocs()
      .then(docs => docs.filter(doc => equal(doc[attribute], value)))
      .then(docs => {
        if (docs.length > 0) return docs[0]
        throw "not found"
      })
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

export const CustomerDatabase = new Database("customers");
export const ItemDatabase = new Database("items");
export const RentalDatabase = new Database("rentals");
