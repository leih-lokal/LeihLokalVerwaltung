<script>
  export let columns = [];
  export let item = {};
  export let rowHeight = 40;
  export let rowBackgroundColorFunction;
  export let cellBackgroundColorFunction;

  const displayValue = (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display ? col.display(item[col.key]) : item[col.key];
    }
  };
</script>

<tr
  on:click
  style={`--rowHeight: ${rowHeight}px; ${
    rowBackgroundColorFunction
      ? "background-color: " + rowBackgroundColorFunction(item)
      : ""
  }`}>
  {#each columns as col}
    <td>
      {#if col.isImageUrl}
        {#if item[col.key] && displayValue(col, item) !== ""}
          <img src={displayValue(col, item)} alt="item" />
        {/if}
      {:else if cellBackgroundColorFunction}
        {#await cellBackgroundColorFunction(col, item)}
          <div class="cell">
            {displayValue(col, item)}
          </div>
        {:then color}
          <div class="cell" style={color}>
            {displayValue(col, item)}
          </div>
        {:catch error}
          <div class="cell">
            {displayValue(col, item)}
          </div>
        {/await}
      {:else}
        <div class="cell">
          {displayValue(col, item)}
        </div>
      {/if}
    </td>
  {/each}
</tr>

<style>
  tr:hover {
    background-color: #ff9ef2 !important;
  }

  tr,
  td {
    cursor: pointer;
    height: var(--rowHeight);
    padding: 0px;
    padding-left: 2px;
    padding-right: 2px;
  }

  .cell {
    overflow: hidden;
    max-height: var(--rowHeight);
    text-overflow: ellipsis;
  }

  img {
    height: 100%;
    display: block;
  }

  img:hover {
    height: 200px;
    position: absolute;
    margin-top: -100px;
  }
</style>
