import Database from "ENV_DATABASE";
import { itemDb, customerDb, rentalDb } from "../../utils/stores";
import customerColumns from "../TableEditors/Customers/Columns";
import itemColumns from "../TableEditors/Items/Columns";
import rentalColumns from "../TableEditors/Rentals/Columns";

export default () => {
  const DB_PROPS = [
    { name: "customers", columns: customerColumns, store: customerDb },
    { name: "items", columns: itemColumns, store: itemDb },
    { name: "rentals", columns: rentalColumns, store: rentalDb },
  ];

  const COUCHDB_HOSTS = "ENV_COUCHDB_HOSTS".split(",");

  const canConnectTo = async (host) => {
    const databases = DB_PROPS.map((props) => new Database(props.name, props.columns, host));
    try {
      await Promise.all(databases.map((db) => db.connect()));
      console.debug("connected to couchdb host " + host);
      return databases;
    } catch (error) {
      console.debug(error);
      return [];
    }
  };

  return Promise.all(COUCHDB_HOSTS.map(canConnectTo)).then((results) => {
    const availableHostDbs = results.filter((result) => result.length !== 0);
    if (availableHostDbs.length > 1) {
      for (let i = 1; i < availableHostDbs.length; i++) {
        availableHostDbs[i].forEach((db) => db.disconnect());
        console.debug("disconnected from " + availableHostDbs[i][0].host);
      }
    }
    if (availableHostDbs.length !== 0) {
      DB_PROPS.map((props) => props.store).forEach((store, i) => store.set(availableHostDbs[0][i]));
    } else {
      throw new Error("Es kann keine Verbindung zur Datenbank hergestellt werden!");
    }
  });
};
