<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import Table from "../Table/Table.svelte";
  import { getContext } from "svelte";

  export let columns;
  export let filters;
  export let database;
  export let popupFormularComponent;
  export let addNewItemButton = true;
  export let rowBackgroundColorFunction;

  let table;

  const openStyledModal = getContext("openStyledModal");
  const onModalClose = () => table.refresh();
</script>

<Table
  bind:this={table}
  {database}
  {columns}
  {filters}
  {rowBackgroundColorFunction}
  onRowClicked={(doc) => openStyledModal(popupFormularComponent, { doc: doc, createNew: false }, onModalClose)} />

{#if addNewItemButton}
  <AddNewItemButton
    on:click={openStyledModal(popupFormularComponent, { createNew: true }, onModalClose)} />
{/if}
