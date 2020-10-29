<script>
  import Icon from "fa-svelte/src/Icon.svelte";
  import { faSort } from "@fortawesome/free-solid-svg-icons/faSort";
  import { faSortDown } from "@fortawesome/free-solid-svg-icons/faSortDown";
  import { faSortUp } from "@fortawesome/free-solid-svg-icons/faSortUp";

  export let columns = [];
  export let sortBy = "_id";
  export let sortReverse = false;

  let showSortIndicator = {};
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

  .visible {
    display: inline;
  }
</style>

<thead>
  <tr>
    {#each columns as col}
      <th
        on:mouseout={() => (showSortIndicator = {})}
        on:mouseover={() => {
          showSortIndicator = {};
          showSortIndicator[col.key] = true;
        }}
        on:click={() => {
          if (sortBy == col.key) sortReverse = !sortReverse;
          else sortReverse = false;
          sortBy = col.key;
        }}>
        {col.title}
        <span
          class="sort-indicator"
          class:visible={showSortIndicator[col.key] && sortBy !== col.key}><Icon
            icon={faSort} /></span>
        <span class="sort-indicator-up" class:visible={sortBy === col.key && sortReverse}><Icon
            icon={faSortUp} /></span>
        <span class="sort-indicator-down" class:visible={sortBy === col.key && !sortReverse}><Icon
            icon={faSortDown} /></span>
      </th>
    {/each}
  </tr>
</thead>
