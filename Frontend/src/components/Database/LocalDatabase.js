import Database from "./Database";
import PouchDB from "pouchdb-browser";
import customers from "../../../spec/Database/DummyData/customers";
import items from "../../../spec/Database/DummyData/items";
import rentals from "../../../spec/Database/DummyData/rentals";
import LocalSelectorBuilder from "./LocalSelectorBuilder";

const TEST_DATA = {
  leihlokal: [
    {
      _id: "36c2cf4037ea6e037cb5434834b16fe1",
      _rev: "1-15c80c826d9ccaddd391526098db3aed",
      id: "1002",
      lastname: "Müller",
      firstname: "Max",
      registration_date: 1599696000000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "max.müller@gmx.de",
      street: "Friedrichstrasse",
      house_number: 13,
      postal_code: "76137",
      city: "Karlsruhe",
      telephone_number: "0176 84353342",
      heard: "Freunde Bekannte",
      highlight: "",
      type: "customer",
    },
    {
      _id: "36c2cf4037ea6e037cb5434834d7a1aa",
      _rev: "1-b09b57a6392f095bb7f628dbbfabf467",
      item_id: "0024",
      item_name: "LED-Lichterkette",
      customer_id: "963",
      customer_name: "Meyer",
      rented_on: 1597968000000,
      extended_on: 0,
      to_return_on: 1598572800000,
      returned_on: 1598227200000,
      passing_out_employee: "SK",
      receiving_employee: "LS",
      deposit: 5,
      deposit_returned: -5,
      remark: "",
      type: "rental",
    },
  ],
};

class LocalDatabase extends Database {
  async connect() {
    this.database = new PouchDB(this.name);
    await this.database.bulkDocs(TEST_DATA[this.name]);
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
