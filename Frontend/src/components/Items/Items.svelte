<script>
  import { ItemDatabase } from "../../database/Database.js";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { showNotification } from "../../utils/utils.js";

  let rows = [];

  ItemDatabase.fetchAllDocs()
    .then((items) => (rows = items))
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger");
    });

  ItemDatabase.onChange((changedItems) => (rows = changedItems));

  function onRowClicked(item) {
    console.log("click " + item);
  }
</script>

<Table {rows} {columns} {onRowClicked} />
