<script>
  import WithSearchBox from "../src/components/Table/WithSearchBox";
  export let currentPage = 0;
  export let preprocessedRows = [];
</script>

<WithSearchBox rows={preprocessedRows} let:rows={preprocessedFilteredRows} bind:currentPage>
  {#each preprocessedFilteredRows as row}
    <div class="row">{JSON.stringify(row)}</div>
  {/each}
  <div class="currentPage">{currentPage}</div>
</WithSearchBox>
