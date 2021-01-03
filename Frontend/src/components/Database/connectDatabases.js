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
    const doWithTimeout = (promise, timeoutS = 3) => {
      return new Promise((resolve, reject) => {
        promise.then(resolve, reject);
        setTimeout(
          () => reject(`failed to connect to couchdb host ${host} after ${timeoutS}s!`),
          timeoutS * 1000
        );
      });
    };

    const databases = DB_PROPS.map((props) => new Database(props.name, props.columns, host));
    try {
      await Promise.all(databases.map((db) => doWithTimeout(db.connect())));
      console.debug("connected to couchdb host " + host);
      return databases;
    } catch (error) {
      console.debug(error);
      return [];
    }
  };

  return Promise.all(COUCHDB_HOSTS.map(canConnectTo)).then((results) => {
    const availableHostDbs = results.filter((result) => result.length !== 0);
    if (availableHostDbs.length !== 0) {
      DB_PROPS.map((props) => props.store).forEach((store, i) => store.set(availableHostDbs[0][i]));
    } else {
      throw new Error("Es kann keine Verbindung zur Datenbank hergestellt werden!");
    }
  });
};
