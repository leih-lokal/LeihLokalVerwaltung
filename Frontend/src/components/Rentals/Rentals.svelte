<script>
  import { RentalDatabase } from "../../database/Database.js";
  import { onMount, onDestroy } from "svelte";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { showNotification } from "../../utils/utils.js";

  let rows = [];

  RentalDatabase.fetchAllDocs()
    .then((items) => (rows = items))
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger", 10);
    });

  RentalDatabase.onChange((changedItems) => (rows = changedItems));

  onMount(() => RentalDatabase.syncAndListenForChanges());
  onDestroy(() => RentalDatabase.cancelSyncAndChangeListener());

  function onRowClicked(item) {
    console.log("click " + item);
  }
</script>

<Table {rows} {columns} {onRowClicked} />
