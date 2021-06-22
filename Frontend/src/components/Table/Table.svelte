<script>
  import { createEventDispatcher } from "svelte";
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  export let columns = [];
  export let rowHeight = 40;
  export let cellBackgroundColorsFunction;
  export let data;
  export let indicateSort = {};
  export let tableElement;
  const dispatch = createEventDispatcher();
</script>

<div class="tablecontainer">
  <table bind:this={tableElement}>
    <Header {columns} {indicateSort} on:colHeaderClicked />
    {#each data as row, i (row._id)}
      <Row
        {cellBackgroundColorsFunction}
        {columns}
        item={row}
        {rowHeight}
        evenRowNumber={i % 2 == 0}
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
    height: 100%;
    overflow-x: scroll;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .tablecontainer::-webkit-scrollbar {
    display: none;
  }
</style>
