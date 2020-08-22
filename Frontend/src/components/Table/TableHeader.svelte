<script>
  export let rows = [];
  export let columns = [];

  let lastClickedColumnKey = "_id";
  let lastSortReverse = false;

  const columnSortFunctions = {};

  function sortRowsByColumnKey(columnKey, reverse = false) {
    const mapForSort = columnSortFunctions[columnKey]
      ? columnSortFunctions[columnKey]
      : (value) => value;
    rows = rows.sort((a, b) => {
      a = mapForSort(a[columnKey]);
      b = mapForSort(b[columnKey]);
      if (a < b) return -1 * (reverse ? -1 : 1);
      if (a > b) return 1 * (reverse ? -1 : 1);
      return 0;
    });
  }

  $: columns.forEach((column) => {
    if (column.sort) {
      columnSortFunctions[column.key] = column.sort;
    }
  });
  $: columns, rows, sortRowsByColumnKey(lastClickedColumnKey, lastSortReverse);
</script>

<style>
  th {
    border-bottom: 2px solid #000000;
    position: sticky;
    top: 0;
    background-color: white;
  }

  tr {
    height: 40px;
  }

  th {
    cursor: pointer;
  }
</style>

<thead>
  <tr>
    {#each columns as col}
      <th
        on:click={() => {
          if (lastClickedColumnKey == col.key) lastSortReverse = !lastSortReverse;
          else lastSortReverse = false;
          lastClickedColumnKey = col.key;
          sortRowsByColumnKey(lastClickedColumnKey, lastSortReverse);
        }}>
        {col.title}
      </th>
    {/each}
  </tr>
</thead>
