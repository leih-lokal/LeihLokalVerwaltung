import PouchDB from 'pouchdb-browser'

class Database {

  #customerDb;

  constructor() {
    this.#customerDb = new PouchDB(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@${process.env.COUCHDB_HOST}/customers`);
  }

  async fetchAllCustomers() {
    const allDocs = await this.#customerDb.allDocs({
      include_docs: true
    });
    let docs = allDocs.rows.map(row => row.doc);
    docs.forEach(doc => doc.subscribed_to_newsletter = ['true', 'ja'].includes(String(doc.subscribed_to_newsletter).toLowerCase()));
    return docs;
  }

  updateCustomer(updatedCustomer) {
    return this.#customerDb.get(updatedCustomer._id)
      .then(doc => {
        updatedCustomer._rev = doc._rev;
        return this.#customerDb.put(updatedCustomer);
      })
      .catch(error => console.error(err));
  }

  onCustomerChange(callback) {
    this.#customerDb.changes({
      since: 'now',
      live: true,
      include_docs: true
    })
      .on('change', callback)
      .on('error', error => console.error(error));
  }

}

export default new Database();