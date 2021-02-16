import Database from "./Database";
import PouchDB from "pouchdb-browser";
import testdata from "../../../spec/Database/testdata";
import LocalSelectorBuilder from "./LocalSelectorBuilder";

class LocalDatabase extends Database {
  async connect() {
    this.database = new PouchDB(this.name);
    await this.database.bulkDocs(testdata);
  }

  // https://github.com/pouchdb/pouchdb/issues/6274
  selectorsForSearchWord(searchWord) {
    return this.columnsToSearch(!isNaN(searchWord)).map((column) => ({
      [column.key]: {
        $regex: new RegExp(
          (column?.search === "from_beginning" ? "^(0+?)?" : "") + searchWord,
          "i"
        ),
      },
    }));
  }

  selectorBuilder() {
    return new LocalSelectorBuilder();
  }
}

export default LocalDatabase;
