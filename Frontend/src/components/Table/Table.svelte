<script>
  import VirtualList from "@sveltejs/svelte-virtual-list";
  import TableRow from "./TableRow.svelte";
  import TableHeader from "./TableHeader.svelte";
  import SearchBox from "./SearchBox.svelte";
  import RowsProcessor from "./RowsProcessor";
  export let rows;
  export let columns = [];
  export let onRowClicked = (row) => {};

  let filteredRows = [];
  let initialSortDone = false;

  $: rowsProcessor = new RowsProcessor(columns);
  $: displayRows = rowsProcessor.generateDisplayRows(rows);
  $: displayRows, initialSort();

  function initialSort() {
    if (!initialSortDone && rows.length != 0) {
      displayRows = rowsProcessor.sortByColumnKey(displayRows, "_id");
      initialSortDone = true;
    }
  }
</script>

<style>
  .container {
    height: calc(100% - 150px);
  }
</style>

<SearchBox bind:filteredRows allRows={displayRows} />
<div class="container">
  <TableHeader
    {columns}
    on:columnHeaderClicked={(event) => (displayRows = rowsProcessor.sortByColumnKey(displayRows, event.detail.key, event.detail.sameColumnKeyClickCount % 2 == 0))} />
  <VirtualList items={filteredRows} let:item>
    <TableRow
      {columns}
      {item}
      on:click={() => onRowClicked(rowsProcessor.getRowById(rows, item._id))} />
  </VirtualList>
</div>
