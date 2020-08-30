<script>
  export let columns = [];
  export let item = {};
  export let rowHeight = 40;
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
    {#if col.isImageUrl && item[col.key]}
      <td>
        <img src={item[col.key]} alt="item" />
      </td>
    {:else}
      <td>
        <div class="cell">{col.key in item ? item[col.key] : ''}</div>
      </td>
    {/if}
  {/each}
</tr>
