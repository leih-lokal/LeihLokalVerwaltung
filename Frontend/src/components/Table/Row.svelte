<script>
  import Cell from "./Cell.svelte";
  import COLORS from "../Input/ColorDefs";
  import Menu from "../ContextMenu/Menu.svelte";
  import MenuOption from "../ContextMenu/MenuOption.svelte";

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
      return col.display ? await col.display(item[col.key]) : item[col.key];
    }
  };

  let cellBackgroundColors = new Array(columns.length).fill("white");
  $: cellBackgroundColorsFunction(item).then((newCellBackgroundColors) => {
    if (!newCellBackgroundColors) newCellBackgroundColors = [];
    while (newCellBackgroundColors.length < columns.length) {
      newCellBackgroundColors.push("");
    }
    cellBackgroundColors = newCellBackgroundColors.map((newColor) =>
      newColor && newColor != "" ? newColor : defaultBackgroundColor
    );
  });

  function closeMenu() {
    item.showMenu = false;
  }

  let pos = { x: 0, y: 0 };
  async function onRightClick(e) {
    pos = { x: e.clientX, y: e.clientY };
    console.log("pos:", pos, item);

    // first close all "open" menu's in all steps

    //if (step.showMenu) {
    //		step.showMenu = false;
    //		//await new Promise(res => setTimeout(res, 100));
    //}

    item.showMenu = true;
    console.log("pos:", pos);
  }

  function returnSelectedRental() {
    let isRed = false;
    let i = 0;
    for (i = 0; i < steps.length; i++) {
      steps[i].isRed = isRed;
      if (steps[i] === step) {
        isRed = true;
      }
    }
  }
</script>

<Menu {...pos} on:click={closeMenu} on:clickoutside={closeMenu}>
  <MenuOption
    on:click={returnSelectedRental}
    text="Als zurückgegeben markieren"
  />
</Menu>

<tr
  on:click
  on:contextmenu|preventDefault={onRightClick}
  style={`height: ${rowHeight}px;`}
>
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
    background-color: var(--highligh-color) !important;
    color: white !important;
  }
</style>
