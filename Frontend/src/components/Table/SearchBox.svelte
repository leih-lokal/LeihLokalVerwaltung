<script>
  import RowsProcessor from "./RowsProcessor";

  const rowsProcessor = new RowsProcessor([]);

  let searchTerm = "";
  export let allRows = [];
  export let filteredRows = [];

  $: filteredRows = rowsProcessor.filterRows(allRows, searchTerm);
</script>

<style>
  input {
    margin: 10px;
    width: calc(100% - 20px);
  }
</style>

<input bind:value={searchTerm} />
