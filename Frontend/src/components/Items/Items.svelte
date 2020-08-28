<script>
  import { ItemDatabase } from "../../database/Database.js";
  import { onMount, onDestroy } from "svelte";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { showNotification } from "../../utils/utils.js";

  let rows = [];

  ItemDatabase.fetchAllDocs()
    .then((items) => (rows = items))
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger", 10);
    });

  ItemDatabase.onChange((changedItems) => (rows = changedItems));

  onMount(() => ItemDatabase.syncAndListenForChanges());
  onDestroy(() => ItemDatabase.cancelSyncAndChangeListener());

  function onRowClicked(item) {
    console.log("click " + item);
  }
</script>

<Table {rows} {columns} {onRowClicked} />
