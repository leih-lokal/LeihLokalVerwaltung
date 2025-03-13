<script>
  import Cell from "./Cell.svelte";
  import COLORS from "../Input/ColorDefs";

  export let columns = [];
  export let item = {};
  export let rowHeight = 36;
  export let cellBackgroundColorsFunction;
  export let evenRowNumber = false;

  $: defaultBackgroundColor = evenRowNumber
    ? COLORS.DEFAULT_ROW_BACKGROUND_EVEN
    : COLORS.DEFAULT_ROW_BACKGROUND_ODD;

  const displayValue = async (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display
        ? await col.display(item[col.key], item)
        : item[col.key];
    }
  };

  let cellBackgroundColors = new Array(columns.length).fill("white");
  $: cellBackgroundColorsFunction(item).then((newCellBackgroundColors) => {
    if (!newCellBackgroundColors) newCellBackgroundColors = [];
    while (newCellBackgroundColors.length < columns.length) {
      newCellBackgroundColors.push("");
    }
    cellBackgroundColors = newCellBackgroundColors.map((newColor) =>
      newColor && newColor != "" ? newColor : defaultBackgroundColor,
    );
  });
</script>

<tr on:click style={`height: ${rowHeight}px;`}>
  {#each columns as col, i}
    <Cell
      rowHeight={col.minRowHeight ? col.minRowHeight(item[col.key]) : rowHeight}
      isImage={col.isImageUrl}
      safeHtml={col.safeHtml}
      valueFunction={() => displayValue(col, item)}
      backgroundColor={cellBackgroundColors[i]}
    />
  {/each}
</tr>

<style>
  tr:hover :global(td) {
    background-color: var(--highligh-color) !important;
    color: white !important;
  }
</style>
