import Database from "./Database.js";

class ItemDatabase {
  database;

  constructor() {
    this.database = new Database("items");
  }

  fetchAllItems() {
    return this.database.fetchAllDocs();
  }

  updateItem(updatedItem) {
    return this.database.updateDoc(updatedItem);
  }

  onItemChange(callback) {
    return this.database.onDocChange(callback);
  }
}

export default new ItemDatabase();
