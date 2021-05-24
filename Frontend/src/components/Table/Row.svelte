<script>
  import Cell from "./Cell.svelte";
  import COLORS from "../Input/ColorDefs";

  export let columns = [];
  export let item = {};
  export let rowHeight = 40;
  export let cellBackgroundColorsFunction;
  export let evenRowNumber = false;

  $: defaultBackgroundColor = evenRowNumber
    ? COLORS.DEFAULT_ROW_BACKGROUND_EVEN
    : COLORS.DEFAULT_ROW_BACKGROUND_ODD;

  const displayValue = async (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display ? await col.display(item[col.key]) : item[col.key];
    }
  };

  let cellBackgroundColors = new Array(columns.length).fill("white");
  $: cellBackgroundColorsFunction(item).then(
    (newCellBackgroundColors) =>
      (cellBackgroundColors = newCellBackgroundColors.map((newColor) =>
        newColor && newColor != "" ? newColor : defaultBackgroundColor
      ))
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
  tr:hover :global(td) {
    background-color: var(--red) !important;
    color: white !important;
  }
</style>
