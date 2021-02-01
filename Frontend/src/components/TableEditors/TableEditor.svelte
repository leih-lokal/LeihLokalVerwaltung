<script>
  import { replace, location } from "svelte-spa-router";
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import CONFIG from "./TableEditorConfig";
  import { keyValueStore } from "../../utils/stores";
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";

  export let params;

  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(CONFIG[params.tab].popupFormularComponent, {
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
    console.log("reset");
    searchTerm = "";
    activeFilters = filters.activeByDefault;
    calculateNumberOfPages();
  };

  const setInitialSortCol = (type) =>
    (sortBy = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).key
      : "_id");

  const setInitialSortDirection = (type) =>
    (sortReverse = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
      : false);

  const setUrlByParams = () => {
    //replace(`/${params.tab}/${params.offset}/${params.searchterm}/${params.sortby}/${params.sortreverse}/${params.filters}`);
    replace(`/${params.tab}/${params.offset}`);
  };

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
  $: columns = CONFIG[params.tab].columns;
  $: filters = CONFIG[params.tab].filters;
  $: database = CONFIG[params.tab].getDatabase();
  $: setInitialSortCol(params.tab);
  $: setInitialSortDirection(params.tab);
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: params.tab, currentPage, sortBy, sortReverse, searchTerm, activeFilters, refresh();
  $: params.tab, reset();
  $: params.tab, searchInputRef?.focusSearchInput();
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
  $: if (params.offset >= rowsPerPage * numberOfPages) {
    params.offset = rowsPerPage * (numberOfPages - 1);
    setUrlByParams();
  } else if (params.offset < 0) {
    params.offset = 0;
    setUrlByParams();
  } else {
    currentPage = Math.min(
      numberOfPages,
      (params.offset - (params.offset % rowsPerPage)) / rowsPerPage
    );
  }
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
      cellBackgroundColorsFunction={CONFIG[params.tab].cellBackgroundColorsFunction}
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
<Pagination
  {numberOfPages}
  {currentPage}
  on:pageChange={(event) => {
    if (currentPage != event.detail) {
      params.offset = rowsPerPage * event.detail;
      setUrlByParams();
    }
  }}
/>

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
