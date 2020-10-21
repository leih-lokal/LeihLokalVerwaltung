<script>
  import AddNewItemButton from "./AddNewItemButton.svelte";
  import Table from "./Table/Table.svelte";
  import LoadingAnimation from "./Table/LoadingAnimation.svelte";
  import { getContext } from "svelte";

  export let columns;
  export let filters;
  export let rowStore;
  export let popupComponent;

  const openStyledModal = getContext("openStyledModal");
</script>

{#await $rowStore}
  <LoadingAnimation />
{:then rows}
  <Table
    {rows}
    {columns}
    {filters}
    onRowClicked={(doc) => openStyledModal(popupComponent, { doc: doc })} />
{/await}

<AddNewItemButton on:click={openStyledModal(popupComponent, { createNew: true })} />
