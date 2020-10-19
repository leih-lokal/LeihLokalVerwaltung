<script>
  import WithSearchFilterBar from "../../src/components/Table/WithSearchFilterBar.svelte";
  export let currentPage = 0;
  export let preprocessedRows = [];
  export let columns;
</script>

<WithSearchFilterBar
  {columns}
  rows={preprocessedRows}
  let:rows={preprocessedFilteredRows}
  bind:currentPage>
  {#each preprocessedFilteredRows as row}
    <div class="row">{JSON.stringify(row)}</div>
  {/each}
  <div class="currentPage">{currentPage}</div>
</WithSearchFilterBar>
