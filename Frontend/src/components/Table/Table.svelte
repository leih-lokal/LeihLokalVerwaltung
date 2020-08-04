<script>
  import VirtualList from "@sveltejs/svelte-virtual-list";
  export let rows = [];
  export let columns = [];
  export let onRowClicked = (row) => {};

  let searchTerm = "";
  let displayRows = [];
  let filteredRows = [];
  let columnMapFunctions = {};
  let columnSortFunctions = {};

  let lastSortedByColumnKey = "";
  let sortReverse = false;

  $: columns, rows, generateDisplayRows();
  $: filteredRows = displayRows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  columns.forEach((column) => {
    if (column.map) {
      columnMapFunctions[column.key] = column.map;
    }
    if (column.sort) {
      columnSortFunctions[column.key] = column.sort;
    }
  });

  function getRowById(id) {
    return rows.find((row) => row._id == id);
  }

  function sortByColumnKey(columnKey) {
    if (columnKey === lastSortedByColumnKey) sortReverse = !sortReverse;
    else sortReverse = false;
    lastSortedByColumnKey = columnKey;
    const mapForSort = columnSortFunctions[columnKey]
      ? columnSortFunctions[columnKey]
      : (value) => value;
    filteredRows.sort((a, b) => {
      a = mapForSort(a[columnKey]);
      b = mapForSort(b[columnKey]);
      if (a < b) return -1 * (sortReverse ? -1 : 1);
      if (a > b) return 1 * (sortReverse ? -1 : 1);
      return 0;
    });
  }

  function generateDisplayRows() {
    if (columns.length != 0) {
      displayRows = rows.map((row) => {
        let displayRow = { ...row };
        Object.keys(displayRow)
          .filter((key) => columnMapFunctions[key])
          .forEach((key) => (displayRow[key] = columnMapFunctions[key](displayRow[key])));
        return displayRow;
      });
    }
  }

  sortByColumnKey("_id");
</script>

<style>
  table {
    width: 100%;
    table-layout: fixed;
    position: relative;
    overflow-y: auto;
  }

  th {
    border-bottom: 2px solid #000000;
    position: sticky;
    top: 0;
    background-color: white;
  }

  tr {
    height: 40px;
  }

  td {
    word-wrap: break-word;
  }

  table > tr,
  th {
    cursor: pointer;
  }

  table > tr:hover {
    background-color: #0066ff77 !important;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  input {
    margin: 10px;
    width: calc(100% - 20px);
  }

  .container {
    height: calc(100% - 150px);
  }
</style>

<input bind:value={searchTerm} />
<div class="container">
  <table>
    <thead>
      <tr>
        {#each columns as col}
          <th on:click={() => sortByColumnKey(col.key)}>{col.title}</th>
        {/each}
      </tr>
    </thead>
  </table>
  <VirtualList items={filteredRows} let:item>
    <table>
      <tr on:click={() => onRowClicked(getRowById(item._id))}>
        {#each columns as col}
          <td>{item[col.key]}</td>
        {/each}
      </tr>
    </table>
  </VirtualList>
</div>
