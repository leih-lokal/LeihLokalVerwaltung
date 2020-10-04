<script>
  import { getContext } from "svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import Table from "./Table.svelte";

  const open = getContext("openStyledModal");

  export let database;
  export let columns;
  export let editPopup;

  function onRowClicked(row) {
    open(editPopup, { row, database });
  }
</script>

<DatabaseReader {database} let:rows={loadedRows}>
  <Table rows={loadedRows} {columns} {onRowClicked} />
</DatabaseReader>
