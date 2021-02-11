<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import CONFIG from "./TableEditorConfig";
  import Database from "../Database/ENV_DATABASE";
  import { keyValueStore } from "../../utils/stores";
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";

  export let tab;

  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(CONFIG[tab].popupFormularComponent, {
      createNew: createNew,
      onSave: refresh,
    });
  };
  const shouldBeSortedByInitially = (col) => "initialSort" in col;

  async function calculateNumberOfPages() {
    const data = await loadData();
    const rowsOnLastPage = data.count % rowsPerPage;
    numberOfPages = (data.count - rowsOnLastPage) / rowsPerPage;
    if (rowsOnLastPage > 0) numberOfPages += 1;
    currentPage = 0;
  }

  const refresh = () =>
    (loadData = () =>
      Database.query({
        filters: activeFilters.map((filterName) => filters.filters[filterName]),
        columns,
        searchTerm,
        currentPage,
        rowsPerPage,
        sortBy,
        sortReverse,
        docType,
      }));

  const reset = () => {
    searchTerm = "";
    activeFilters = filters.activeByDefault;
    calculateNumberOfPages();
  };

  const setInitialSortCol = (type) =>
    (sortBy = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).key
      : "id");

  const setInitialSortDirection = (type) =>
    (sortReverse = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
      : false);

  let searchInputRef;
  let loadData = new Promise(() => {});
  let searchTerm = "";
  let currentPage = 0;
  let rowHeight = 40;
  let innerHeight = window.innerHeight;
  let numberOfPages = 1;
  let activeFilters = [];
  let sortBy;
  let sortReverse;
  $: columns = CONFIG[tab].columns;
  $: filters = CONFIG[tab].filters;
  $: docType = CONFIG[tab].docType;
  $: setInitialSortCol(tab);
  $: setInitialSortDirection(tab);
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: tab, currentPage, sortBy, sortReverse, searchTerm, activeFilters, refresh();
  $: tab, reset();
  $: tab, searchInputRef?.focusSearchInput();
  $: activeFilters, calculateNumberOfPages();
  $: searchTerm, calculateNumberOfPages();
  $: sortBy, sortReverse, (currentPage = 0);
  $: indicateSort = columns.map((col) => {
    if (col.key === sortBy) {
      return sortReverse ? "up" : "down";
    } else {
      return "";
    }
  });
</script>

<svelte:window bind:innerHeight />

<SearchFilterBar
  filterOptions={Object.keys(filters.filters).map((filter) => ({ value: filter, label: filter }))}
  bind:activeFilters
  bind:searchTerm
  bind:this={searchInputRef}
/>

{#await loadData()}
  <LoadingAnimation />
{:then data}
  <div in:fade class="animatecontainer">
    <Table
      {rowHeight}
      {columns}
      data={data.docs}
      cellBackgroundColorsFunction={CONFIG[tab].cellBackgroundColorsFunction}
      {indicateSort}
      on:rowClicked={(event) => {
        keyValueStore.setValue("currentDoc", event.detail);
        openPopupFormular(false);
      }}
      on:colHeaderClicked={(event) => {
        if (sortBy == event.detail.key) sortReverse = !sortReverse;
        else sortReverse = false;
        sortBy = event.detail.key;
      }}
    />
  </div>
{:catch error}
  {#if error.status === 401}
    <p class="error">
      Nutzer oder Passwort für die Datenbank ist nicht korrekt. Bitte in den Einstellungen (Zahnrad
      rechts oben) überprüfen.
    </p>
  {:else}
    <p class="error">
      Keine Verbindung mit der Datenbank. <br />{error.hasOwnProperty("message")
        ? error.message
        : ""}
    </p>
  {/if}
{/await}
<Pagination {numberOfPages} bind:currentPage />

<AddNewItemButton
  on:click={() => {
    keyValueStore.removeValue("currentDoc");
    openPopupFormular(true);
  }}
/>

<style>
  .animatecontainer {
    height: 100%;
  }

  .error {
    color: red;
    font-size: large;
    margin: 20px;
  }
</style>
