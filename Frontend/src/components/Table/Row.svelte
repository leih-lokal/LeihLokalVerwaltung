<script>
  import Cell from "./Cell.svelte";

  export let columns = [];
  export let item = {};
  export let rowHeight = 40;
  export let cellBackgroundColorsFunction;

  const displayValue = (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display ? col.display(item[col.key]) : item[col.key];
    }
  };

  let cellBackgroundColors = new Array(columns.length).fill("white");
  $: cellBackgroundColorsFunction(item).then(
    (newCellBackgroundColors) => (cellBackgroundColors = newCellBackgroundColors)
  );
</script>

<tr on:click style={`height: ${rowHeight}px;`}>
  {#each columns as col, i}
    <Cell
      {rowHeight}
      isImage={col.isImageUrl}
      value={displayValue(col, item)}
      backgroundColor={cellBackgroundColors[i]}
    />
  {/each}
</tr>

<style>
  tr:hover {
    background-color: #ff9ef2 !important;
  }
</style>
