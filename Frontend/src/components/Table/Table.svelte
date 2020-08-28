<script>
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import SearchBox from "./SearchBox.svelte";
  import Pagination from "./Pagination.svelte";
  import { Pulse } from "svelte-loading-spinners";
  import { fade } from "svelte/transition";

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

  .loadingAnimation {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -60px;
    margin-top: -60px;
  }
</style>

<div class="container">
  <SearchBox bind:filteredRows rows={displayRows} />
  {#if !rows || rows.length === 0}
    <div in:fade={{ duration: 4000 }} class="loadingAnimation">
      <Pulse size="120" color="#fc03a9" unit="px" />
    </div>
  {:else}
    <div in:fade class="tableWithPagination">
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
  {/if}
</div>
