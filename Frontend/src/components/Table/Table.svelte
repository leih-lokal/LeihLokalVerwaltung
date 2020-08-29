<script>
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import SearchBox from "./SearchBox.svelte";
  import Pagination from "./Pagination.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import { fade } from "svelte/transition";

  export let rows;
  export let columns = [];
  export let onRowClicked = (row) => {};

  let rowsPerPage = Math.round((window.innerHeight - 240) / 40);
  let tableHeight;
  let displayRows = [];
  let filteredRows = [];
  let pageRows = [];
  let currentPage = 0;
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

  // adjust rowsPerPage dynamically
  $: if (tableHeight > window.innerHeight - 150) {
    rowsPerPage = rowsPerPage - 1;
  } else if (tableHeight < window.innerHeight - 360) {
    rowsPerPage = rowsPerPage + 1;
  }
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

  :global(table tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
</style>

<div class="container">
  <SearchBox bind:filteredRows rows={displayRows} bind:currentPage />
  {#if !rows || rows.length === 0}
    <LoadingAnimation />
  {:else}
    <div in:fade class="tableWithPagination">
      <table bind:clientHeight={tableHeight}>
        <TableHeader {columns} bind:rows />
        {#each pageRows as item}
          <TableRow
            {columns}
            {item}
            on:click={() => onRowClicked(rows.find((row) => row._id == item._id))} />
        {/each}
      </table>
      <Pagination rows={filteredRows} bind:pageRows {rowsPerPage} bind:currentPage />
    </div>
  {/if}
</div>
