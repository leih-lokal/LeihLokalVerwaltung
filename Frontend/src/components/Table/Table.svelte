<script>
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import SearchBox from "./SearchBox.svelte";
  import Pagination from "./Pagination.svelte";

  export let rows;
  export let columns = [];
  export let onRowClicked = (row) => {};

  let displayRows = [];
  let filteredRows = [];
  let pageRows = [];
  const displayFunctions = {};

  $: columns.forEach((column) => {
    if (column.display) {
      displayFunctions[column.key] = column.display;
    }
  });
  $: displayRows = rows.map((row) => {
    let displayRow = { ...row };
    Object.keys(displayRow)
      .filter((key) => displayFunctions[key])
      .forEach((key) => (displayRow[key] = displayFunctions[key](displayRow[key])));
    return displayRow;
  });
  $: filteredRows.forEach((row, i) => (row["index"] = i));
</script>

<style>
  .container {
    height: calc(100% - 80px);
  }

  table {
    width: 100%;
    table-layout: auto;
    position: relative;
    overflow-y: scroll;
  }
</style>

<div class="container">
  <SearchBox bind:filteredRows rows={displayRows} />
  <table>
    <TableHeader {columns} bind:rows />
    {#each pageRows as item}
      <TableRow
        {columns}
        {item}
        on:click={() => onRowClicked(rows.find((row) => row._id == item._id))} />
    {/each}
  </table>
  <Pagination rows={filteredRows} bind:pageRows />
</div>
