<script>
  import { RentalDatabase } from "../../database/Database.js";
  import { onMount, onDestroy } from "svelte";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { notifier } from "@beyonk/svelte-notifications";

  let rows = [];

  RentalDatabase.fetchAllDocs()
    .then((items) => (rows = items))
    .catch((error) => {
      console.error(error);
      notifier.danger("Laden aus der Datenbank fehlgeschlagen!", 10000);
    });

  RentalDatabase.onChange((changedItems) => (rows = changedItems));

  onMount(() => RentalDatabase.syncAndListenForChanges());
  onDestroy(() => RentalDatabase.cancelSyncAndChangeListener());

  function onRowClicked(item) {
    console.log("click " + item);
  }
</script>

<Table {rows} {columns} {onRowClicked} />
