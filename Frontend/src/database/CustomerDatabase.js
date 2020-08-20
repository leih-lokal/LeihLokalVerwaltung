import Database from "./Database.js";

class CustomerDatabase {
  database;

  constructor() {
    this.database = new Database("customers");
  }

  fetchAllCustomers() {
    return this.database.fetchAllDocs();
  }

  updateCustomer(updatedCustomer) {
    return this.database.updateDoc(updatedCustomer);
  }

  onCustomerChange(callback) {
    return this.database.onDocChange(callback);
  }
}

export default new CustomerDatabase();
