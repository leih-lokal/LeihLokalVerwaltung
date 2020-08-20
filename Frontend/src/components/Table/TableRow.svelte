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

  td {
    word-wrap: break-word;
  }

  .odd {
    background-color: #f2f2f2;
  }

  table {
    width: 100%;
    table-layout: fixed;
    position: relative;
    overflow-y: auto;
  }
</style>

<table>
  <tr on:click class={item.index % 2 === 0 ? 'even' : 'odd'}>
    {#each columns as col}
      <td>{item[col.key]}</td>
    {/each}
  </tr>
</table>
