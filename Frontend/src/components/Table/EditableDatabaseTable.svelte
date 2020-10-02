<script>
  import { getContext } from "svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import Table from "./Table.svelte";

  const { open } = getContext("simple-modal");

  export let database;
  export let columns;
  export let editPopup;

  function onRowClicked(row) {
    open(
      editPopup,
      { row, database },
      {
        closeButton: false,
        closeOnEsc: false,
        closeOnOuterClick: false,
        styleWindow: {
          width: "90%",
          "max-width": "950px",
          height: "80%",
          overflow: "hidden",
        },
        styleContent: {
          height: "100%",
        },
      }
    );
  }
</script>

<DatabaseReader {database} let:rows={loadedRows}>
  <Table rows={loadedRows} {columns} {onRowClicked} />
</DatabaseReader>
