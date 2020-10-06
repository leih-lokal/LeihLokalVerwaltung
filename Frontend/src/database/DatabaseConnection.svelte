<script>
  import Database from "./Database";
  import { onDestroy, setContext } from "svelte";
  import { passwordStore } from "./passwordStore";

  const CustomerDatabase = new Database("customers");
  const ItemDatabase = new Database("items");
  const RentalDatabase = new Database("rentals");

  setContext("customerDatabase", CustomerDatabase);
  setContext("itemDatabase", ItemDatabase);
  setContext("rentalDatabase", RentalDatabase);

  const unsubscribe = passwordStore.subscribe((value) => {
    if (value && value.length > 0) {
      Promise.all([
        CustomerDatabase.connect(),
        ItemDatabase.connect(),
        RentalDatabase.connect(),
      ]).catch(function (error) {
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

  onDestroy(unsubscribe);
</script>

<slot />
