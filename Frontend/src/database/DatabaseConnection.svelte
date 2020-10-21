<script>
  import Database from "./Database";
  import { onDestroy } from "svelte";
  import {
    passwordStore,
    customers,
    items,
    rentals,
    itemDb as itemDbStore,
    customerDb as customerDbStore,
    rentalDb as rentalDbStore,
  } from "./stores";

  const databases = [new Database("customers"), new Database("items"), new Database("rentals")];
  const dbStores = [customerDbStore, itemDbStore, rentalDbStore];
  const dbItemStores = [customers, items, rentals];

  dbStores.forEach((store, i) => store.set(databases[i]));

  const unsubscribe = passwordStore.subscribe((value) => {
    if (value && value.length > 0) {
      Promise.all(databases.map((db) => db.connect()))
        .then(() =>
          Promise.all(
            databases.map((db, i) =>
              db.fetchAllDocs().then((docs) => dbItemStores[i].set(Promise.resolve(docs)))
            )
          )
        )
        .then(() => {
          databases.forEach((db, i) =>
            db.onChange((docs) => dbItemStores[i].set(Promise.resolve(docs)))
          );
          databases.forEach((db) => db.syncAndListenForChanges());
        })
        .catch(function (error) {
          console.debug(error);
          if (error.status === 401) {
            alert("Falsches Passwort!");
          } else {
            alert("Es kann keine Verbindung zur Datenbank hergestellt werden!");
          }
          localStorage.removeItem("password");
          location.reload();
        });
    }
  });

  onDestroy(() => {
    unsubscribe();
    customerDatabase.cancelSyncAndChangeListener();
    itemDatabase.cancelSyncAndChangeListener();
    rentalDatabase.cancelSyncAndChangeListener();
  });
</script>
