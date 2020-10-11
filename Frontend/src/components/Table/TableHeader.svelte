<script>
  import Icon from 'fa-svelte'
  import { faSort } from '@fortawesome/free-solid-svg-icons/faSort'
  import { faSortDown } from '@fortawesome/free-solid-svg-icons/faSortDown'
  import { faSortUp } from '@fortawesome/free-solid-svg-icons/faSortUp'

  export let rows = [];
  export let columns = [];

  let lastClickedColumnKey = "_id";
  let lastSortReverse = false;

  const columnSortFunctions = {};

  for (let i = 0; i < columns.length; i++) {
    if (columns[i].initialSort) {
      lastClickedColumnKey = columns[i].key;
      if (columns[i].initialSort === "desc") lastSortReverse = true;
      break;
    }
  }

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

  let showSortIndicator = {};
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

  span {
    display: none;
  }

  .visible { display: inline;}
</style>

<thead>
  <tr>
    {#each columns as col}
      <th
        on:mouseout={() => showSortIndicator = {}}
        on:mouseover={() => {
          showSortIndicator = {};
          showSortIndicator[col.key] = true;
        }}
        on:click={() => {
          if (lastClickedColumnKey == col.key) lastSortReverse = !lastSortReverse;
          else lastSortReverse = false;
          lastClickedColumnKey = col.key;
          sortRowsByColumnKey(lastClickedColumnKey, lastSortReverse);
        }}>
        {col.title}
        <span class="sort-indicator" class:visible={showSortIndicator[col.key] && lastClickedColumnKey !== col.key}><Icon icon={faSort}/></span>
        <span class="sort-indicator-up" class:visible={lastClickedColumnKey === col.key && lastSortReverse}><Icon icon={faSortUp}/></span>
        <span class="sort-indicator-down" class:visible={lastClickedColumnKey === col.key && !lastSortReverse}><Icon icon={faSortDown}/></span>
      </th>
    {/each}
  </tr>
</thead>
