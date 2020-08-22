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
</style>

<tr on:click class={item.index % 2 === 0 ? 'even' : 'odd'}>
  {#each columns as col}
    <td>{item[col.key]}</td>
  {/each}
</tr>
