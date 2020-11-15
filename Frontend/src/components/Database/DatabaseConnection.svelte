<script>
  import Database from "ENV_DATABASE";
  import { onDestroy } from "svelte";
  import { itemDb, customerDb, rentalDb } from "../../utils/stores";
  import customerColumns from "../TableEditors/Customers/Columns";
  import itemColumns from "../TableEditors/Items/Columns";
  import rentalColumns from "../TableEditors/Rentals/Columns";

  const databases = [
    new Database("customers", customerColumns),
    new Database("items", itemColumns),
    new Database("rentals", rentalColumns),
  ];
  const dbStores = [customerDb, itemDb, rentalDb];

  Promise.all(databases.map((db) => db.connect())).catch(function (error) {
      console.debug(error);
      if (error.status === 401) {
        alert("Falsches Passwort!");
      } else {
        alert("Es kann keine Verbindung zur Datenbank hergestellt werden!");
      }
    });

  dbStores.forEach((store, i) => store.set(databases[i]));

  onDestroy(() => {
    unsubscribe();
    customerDatabase.cancelSyncAndChangeListener();
    itemDatabase.cancelSyncAndChangeListener();
    rentalDatabase.cancelSyncAndChangeListener();
  });
</script>
