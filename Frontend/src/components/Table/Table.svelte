<script>
  import { createEventDispatcher } from "svelte";
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import { fade } from "svelte/transition";
  export let columns = [];
  export let rowHeight = 40;
  export let cellBackgroundColorsFunction;
  export let loadData;
  export let indicateSort = {};
  export let onLoadDataErrorText = () => "Fehler";
  const dispatch = createEventDispatcher();
</script>

<div class="tablecontainer">
  <table>
    <Header {columns} {indicateSort} on:colHeaderClicked />
    {#await loadData}
      <LoadingAnimation />
    {:then data}
      <tbody in:fade>
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
      </tbody>
    {:catch error}
      <p class="error">
        {@html onLoadDataErrorText(error)}
      </p>
    {/await}
  </table>
</div>

<style>
  table {
    width: 100%;
    table-layout: auto;
    position: relative;
    overflow-y: scroll;
    border-spacing: 1px;
    padding: 0 5px 0 5px;
  }

  .tablecontainer {
    height: 100%;
    overflow-x: scroll;
  }

  .tablecontainer::-webkit-scrollbar {
    display: none;
  }

  .error {
    position: absolute;
    color: red;
    font-size: 2em;
    margin: 20px;
    width: 100%;
  }
</style>
