<script>
  import WithSearchBox from "../src/components/Table/WithSearchBox";
  let currentPage = 0;
  export let preprocessedRows = [];
</script>

<WithSearchBox rows={preprocessedRows} let:rows={preprocessedFilteredRows} bind:currentPage>
  {#each preprocessedFilteredRows as row}<a>{JSON.stringify(row)}</a>{/each}
</WithSearchBox>
