<script>
  import WithPagination from "../../src/components/Table/WithPagination.svelte";
  export let currentPage = 0;
  export let rows = [];
  export let rowHeight = 40;
</script>

<WithPagination {rowHeight} {rows} let:rows={rowsOfCurrentPage} bind:currentPage>
  {#each rowsOfCurrentPage as row}
    <div class="row">{JSON.stringify(row)}</div>
  {/each}
  <div class="currentPage">{currentPage}</div>
</WithPagination>
