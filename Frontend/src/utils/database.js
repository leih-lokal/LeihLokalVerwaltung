import PouchDB from 'pouchdb-browser'

class Database {

  #customerDb;

  constructor(){
    this.#customerDb = new PouchDB({
      'name': 'http://192.168.178.50:5984/customers',
      'auth.username': 'admin',
      'auth.password': 'password'
    });
  }

  async fetchAllCustomers() {
    const allDocs = await this.#customerDb.allDocs({
      include_docs: true
    });
    return allDocs.rows.map(row => row.doc);
  }

}

export default new Database();