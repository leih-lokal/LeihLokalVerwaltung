<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import Table from "../Table/Table.svelte";
  import { getContext } from "svelte";

  export let columns;
  export let filters;
  export let database;
  export let popupComponent;
  export let addNewItemButton = true;

  let table;

  const openStyledModal = getContext("openStyledModal");
  const onModalClose = () => table.refresh();
</script>

<Table
  bind:this={table}
  {database}
  {columns}
  {filters}
  onRowClicked={(doc) => openStyledModal(popupComponent, { doc: doc }, onModalClose)} />

{#if addNewItemButton}
  <AddNewItemButton on:click={openStyledModal(popupComponent, { createNew: true }, onModalClose)} />
{/if}
