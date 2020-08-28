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

  .odd {
    background-color: #f2f2f2;
  }

  img {
    height: 38px;
  }

  img:hover {
    height: 200px;
    position: absolute;
    margin-top: -100px;
  }
</style>

<tr on:click class={item.index % 2 === 0 ? 'even' : 'odd'}>
  {#each columns as col}
    {#if col.isImageUrl && item[col.key]}
      <td>
        <img src={item[col.key]} alt="item" />
      </td>
    {:else}
      <td>{item[col.key] ? item[col.key] : ''}</td>
    {/if}
  {/each}
</tr>
