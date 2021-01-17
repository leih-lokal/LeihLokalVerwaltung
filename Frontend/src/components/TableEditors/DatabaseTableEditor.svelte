<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import Table from "../Table/Table.svelte";
  import { keyValueStore } from "../../utils/stores";
  import { getContext } from "svelte";

  export let columns;
  export let filters;
  export let database;
  export let popupFormularComponent;
  export let addNewItemButton = true;
  export let rowBackgroundColorFunction;
  export let cellStyleFunction;

  let table;

  const openStyledModal = getContext("openStyledModal");
</script>

<Table
  bind:this={table}
  {database}
  {columns}
  {filters}
  {rowBackgroundColorFunction}
  {cellStyleFunction}
  onRowClicked={(doc) => {
    keyValueStore.setValue("currentDoc", doc);
    openStyledModal(popupFormularComponent, {
      createNew: false,
      onSave: table.refresh,
    });
  }}
/>

{#if addNewItemButton}
  <AddNewItemButton
    on:click={() => {
      keyValueStore.removeValue("currentDoc");
      openStyledModal(popupFormularComponent, {
        createNew: true,
        onSave: table.refresh,
      });
    }}
  />
{/if}
