<script>
  export let columns = [];
  export let item = {};
  export let rowHeight = 40;

  const displayValue = (colKey, item) => {
    if (!colKey in item) {
      return "";
    } else {
      const displayFunction = columns.find((col) => col.key === colKey)["display"];
      return displayFunction ? displayFunction(item[colKey]) : item[colKey];
    }
  };
</script>

<style>
  tr:hover {
    background-color: #0066ff77 !important;
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
  }

  img:hover {
    height: 200px;
    position: absolute;
    margin-top: -100px;
  }
</style>

<tr on:click style="--rowHeight: {rowHeight}px">
  {#each columns as col}
    <td>
      {#if col.isImageUrl}
        {#if item[col.key]}<img src={item[col.key]} alt="item" />{/if}
      {:else}
        <div class="cell">{displayValue(col.key, item)}</div>
      {/if}
    </td>
  {/each}
</tr>
