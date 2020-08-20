<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let columns = [];

  let lastClickedColumnKey = "_id";
  let sameColumnKeyClickCount = 1;
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

  th {
    cursor: pointer;
  }
</style>

<table>
  <thead>
    <tr>
      {#each columns as col}
        <th
          on:click={() => {
            if (lastClickedColumnKey == col.key) sameColumnKeyClickCount++;
            else sameColumnKeyClickCount = 1;
            lastClickedColumnKey = col.key;
            dispatch('columnHeaderClicked', {
              key: col.key,
              sameColumnKeyClickCount: sameColumnKeyClickCount,
            });
          }}>
          {col.title}
        </th>
      {/each}
    </tr>
  </thead>
</table>
