<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import CONFIG from "./TableEditorConfig";
  import { keyValueStore } from "../../utils/stores";
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";

  export let tableEditorId;

  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(CONFIG[tableEditorId].popupFormularComponent, {
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
      database.query({
        filters: activeFilters.map((filterName) => filters.filters[filterName]),
        columns: columns,
        searchTerm: searchTerm,
        currentPage: currentPage,
        rowsPerPage: rowsPerPage,
        sortBy: sortBy,
        sortReverse: sortReverse,
      }));

  const reset = () => {
    searchTerm = "";
    activeFilters = filters.activeByDefault;
    calculateNumberOfPages();
  };

  let searchInputRef;
  let loadData = new Promise(() => {});
  let searchTerm = "";
  let currentPage = 0;
  let rowHeight = 40;
  let innerHeight = window.innerHeight;
  let numberOfPages = 0;
  let activeFilters = [];
  $: columns = CONFIG[tableEditorId].columns;
  $: filters = CONFIG[tableEditorId].filters;
  $: database = CONFIG[tableEditorId].getDatabase();
  $: sortBy = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).key
    : "_id";
  $: sortReverse = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
    : false;
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: tableEditorId, currentPage, sortBy, sortReverse, searchTerm, activeFilters, refresh();
  $: tableEditorId, reset();
  $: tableEditorId, searchInputRef?.focusSearchInput();
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
      {data}
      cellBackgroundColorsFunction={CONFIG[tableEditorId].cellBackgroundColorsFunction}
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
</style>
