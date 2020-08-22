<script>
  import VirtualList from "@sveltejs/svelte-virtual-list";
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import SearchBox from "./SearchBox.svelte";

  export let rows;
  export let columns = [];
  export let onRowClicked = (row) => {};

  let displayRows = [];
  let filteredRows = [];
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
    height: calc(100% - 150px);
  }
</style>

<SearchBox bind:filteredRows rows={displayRows} />
<div class="container">
  <TableHeader {columns} bind:rows={filteredRows} />
  <VirtualList items={filteredRows} let:item>
    <TableRow
      {columns}
      {item}
      on:click={() => onRowClicked(rows.find((row) => row._id == item._id))} />
  </VirtualList>
</div>
