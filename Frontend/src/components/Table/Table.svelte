<script>
  import { createEventDispatcher } from "svelte";
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  export let columns = [];
  export let rowHeight = 40;
  export let rowBackgroundColorFunction;
  export let data;
  export let indicateSort = {};
  export let cellStyleFunction;
  const dispatch = createEventDispatcher();
</script>

<div class="tablecontainer">
  <table>
    <Header {columns} {indicateSort} on:colHeaderClicked />
    {#each data.rows as row (row._id)}
      <Row
        {rowBackgroundColorFunction}
        {cellStyleFunction}
        {columns}
        item={row}
        {rowHeight}
        on:click={() => dispatch("rowClicked", row)}
      />
    {/each}
  </table>
</div>

<style>
  table {
    width: 100%;
    table-layout: auto;
    position: relative;
    overflow-y: scroll;
    border-spacing: 2px 2px;
    padding: 0 5px 0 5px;
  }

  .tablecontainer {
    overflow-x: scroll;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .tablecontainer::-webkit-scrollbar {
    display: none;
  }

  :global(table tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
</style>
