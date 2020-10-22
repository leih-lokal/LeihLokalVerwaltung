<script>
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import WithSearchFilterBar from "./WithSearchFilterBar.svelte";
  import WithPagination from "./WithPagination.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import { fade } from "svelte/transition";

  export let onRowClicked = (row) => {};
  export let rows = [];
  export let columns = [];
  export let rowHeight = 40;
  export let filters = {};

  let currentPage = 0;

  $: sortedUnprocessedRows = rows;
</script>

<style>
  div {
    height: 100%;
  }

  table {
    width: 100%;
    table-layout: auto;
    position: relative;
    overflow-y: scroll;
    border-spacing: 2px 2px;
  }

  :global(table tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
</style>

<div class="container">
  {#if rows.length === 0}
    <LoadingAnimation />
  {:else}
    <WithSearchFilterBar {columns} {rows} {filters} let:rows={filteredRows} bind:currentPage>
      <div in:fade>
        <WithPagination
          rows={filteredRows}
          let:rows={rowsOfCurrentPage}
          bind:currentPage
          {rowHeight}>
          <table>
            <TableHeader {columns} bind:rows={sortedUnprocessedRows} />
            {#each rowsOfCurrentPage as row}
              <TableRow
                {columns}
                item={row}
                {rowHeight}
                on:click={() => onRowClicked(rows.find((x) => x._id === row._id))} />
            {/each}
          </table>
        </WithPagination>
      </div>
    </WithSearchFilterBar>
  {/if}
</div>
