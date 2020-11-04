<script>
  export let columns = [];
  export let item = {};
  export let rowHeight = 40;

  const displayValue = (col, item) => {
    if (!(col.key in item)) {
      return "";
    } else {
      return col.display ? col.display(item[col.key]) : item[col.key];
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
    display: block;
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
        {#if item[col.key] && displayValue(col, item) !== ''}
          <img src={displayValue(col, item)} alt="item" />
        {/if}
      {:else}
        <div class="cell">{displayValue(col, item)}</div>
      {/if}
    </td>
  {/each}
</tr>
