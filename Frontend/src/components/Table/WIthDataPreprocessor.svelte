<script>
  import LoadingAnimation from "./LoadingAnimation.svelte";

  export let rows = [];
  export let columns = [];

  let isLoading = true;
  const displayFunctions = {};

  function generateDisplayValues() {
    rows = rows.map((row) => {
      let displayRow = { ...row };
      Object.keys(displayRow)
        .filter((key) => displayFunctions[key])
        .forEach((key) => (displayRow[key] = displayFunctions[key](displayRow[key])));
      return displayRow;
    });
    if (rows.length !== 0) isLoading = false;
  }

  $: columns.forEach((column) => {
    if (column.display) {
      displayFunctions[column.key] = column.display;
    }
  });
  $: rows, generateDisplayValues();
</script>

<style>
  .container {
    height: 100%;
  }
</style>

<div class="container">
  {#if isLoading}
    <LoadingAnimation />
  {:else}
    <slot {rows} {columns} />
  {/if}
</div>
