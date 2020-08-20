<script>
  import ItemDatabase from "../../database/ItemDatabase.js";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { showNotification } from "../../utils/utils.js";
  import RowsProcessor from "../Table/RowsProcessor.js";

  let rows = [];
  const rowsProcessor = new RowsProcessor([]);

  ItemDatabase.fetchAllItems()
    .then((items) => (rows = items))
    .then(() =>
      ItemDatabase.onItemChange((change) => {
        if (change.deleted) {
          rows = rowsProcessor.removeRow(rows, change.id);
        } else {
          rows = rowsProcessor.updateRow(rows, change.doc);
        }
      })
    )
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger");
    });

  function onRowClicked(item) {
    console.log("click " + item);
  }
</script>

<Table {rows} {columns} {onRowClicked} />
