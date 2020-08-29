<script>
  export let columns = [];
  export let item = {};
</script>

<style>
  tr:hover {
    background-color: #0066ff77 !important;
  }

  tr {
    cursor: pointer;
    height: 40px;
  }

  img {
    height: 60px;
  }

  img:hover {
    height: 200px;
    position: absolute;
    margin-top: -100px;
  }
</style>

<tr on:click>
  {#each columns as col}
    {#if col.isImageUrl && item[col.key]}
      <td>
        <img src={item[col.key]} alt="item" />
      </td>
    {:else}
      <td>{col.key in item ? item[col.key] : ''}</td>
    {/if}
  {/each}
</tr>
