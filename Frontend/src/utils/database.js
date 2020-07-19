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
    let docs = allDocs.rows.map(row => row.doc);
    docs.forEach(doc => doc.subscribed_to_newsletter = ['true', 'ja'].includes(String(doc.subscribed_to_newsletter).toLowerCase()));
    return docs;
  }

  onCustomerChange(callback){
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