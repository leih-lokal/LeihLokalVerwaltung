<script>
  import TableHeader from "../../src/components/Table/TableHeader.svelte";
  export let rows = [];
  export let columns;
</script>

<TableHeader {columns} bind:rows />
{#each rows as row}
  <div class="row">{JSON.stringify(row)}</div>
{/each}
