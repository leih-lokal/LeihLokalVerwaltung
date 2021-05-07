<script>
  import Cell from "./Cell.svelte";

  export let columns = [];
  export let item = {};
  export let rowHeight = 40;
  export let cellBackgroundColorsFunction;
  export let evenRowNumber = false;

  const displayValue = async (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display ? await col.display(item[col.key]) : item[col.key];
    }
  };

  let cellBackgroundColors = new Array(columns.length).fill("white");
  $: cellBackgroundColorsFunction(item, evenRowNumber).then(
    (newCellBackgroundColors) => (cellBackgroundColors = newCellBackgroundColors)
  );
</script>

<tr on:click style={`height: ${rowHeight}px;`}>
  {#each columns as col, i}
    <Cell
      {rowHeight}
      isImage={col.isImageUrl}
      valueFunction={() => displayValue(col, item)}
      backgroundColor={cellBackgroundColors[i]}
    />
  {/each}
</tr>

<style>
  tr:hover {
    background-color: #ff9ef2 !important;
  }
</style>
