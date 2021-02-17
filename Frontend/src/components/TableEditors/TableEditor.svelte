<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import CONFIG from "./TableEditorConfig";
  import Database from "../Database/ENV_DATABASE";
  import { keyValueStore } from "../../utils/stores";
  import { getContext, setContext } from "svelte";
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

  const refresh = () =>
    (loadData = () => {
      return Database.query({
        filters: activeFilters.map((filterName) => filters.filters[filterName]),
        columns,
        searchTerm,
        currentPage,
        rowsPerPage,
        sortBy: sort,
        sortReverse,
        docType,
      }).then((data) => {
        searchInputRef?.focusSearchInput();
        const rowsOnLastPage = data.count % rowsPerPage;
        numberOfPages = (data.count - rowsOnLastPage) / rowsPerPage;
        if (rowsOnLastPage > 0) numberOfPages += 1;
        return data;
      });
    });

  const initNewTab = (tab) => {
    if (tab) {
      if (searchTerm !== "") searchTerm = "";
      columns = CONFIG[tab].columns;
      filters = CONFIG[tab].filters;
      docType = CONFIG[tab].docType;
      activeFilters = filters.activeByDefault;
      searchTerm = "";
      setInitialSortCol();
      setInitialSortDirection();
    }
  };

  const setInitialSortCol = () => {
    sortByColKey = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).key
      : "id";
    const col = columns.find((col) => col.key === sortByColKey);
    sort = col.sort ? col.sort : [sortByColKey];
  };

  const setInitialSortDirection = () =>
    (sortReverse = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
      : false);

  const goToFirstPage = () => {
    if (currentPage !== 0) {
      currentPage = 0;
    }
  };

  let searchInputRef;
  let loadData = () => new Promise(() => {});
  let searchTerm;
  let currentPage = 0;
  let rowHeight = 40;
  let innerHeight = window.innerHeight;
  let numberOfPages = 1;
  let activeFilters = [];
  let sortByColKey;
  let sortReverse;
  let sort;
  let columns;
  let filters;
  let docType;
  let indicateSort;
  $: initNewTab(tab);
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: tab, currentPage, sortByColKey, sortReverse, searchTerm, activeFilters, refresh();
  $: sortByColKey, sortReverse, searchTerm, activeFilters, goToFirstPage();
  $: indicateSort = columns.map((col) => {
    if (col.key === sortByColKey) {
      return sortReverse ? "up" : "down";
    } else {
      return "";
    }
  });
</script>

<svelte:window bind:innerHeight />

<SearchFilterBar
  filterOptions={Object.keys(filters.filters).map((filter) => ({ value: filter, label: filter }))}
  {activeFilters}
  bind:searchTerm
  on:filtersChanged={(event) => {
    if (JSON.stringify(event.detail) !== JSON.stringify(activeFilters)) {
      activeFilters = event.detail;
    }
  }}
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
        if (sortByColKey == event.detail.key) sortReverse = !sortReverse;
        else sortReverse = false;
        sortByColKey = event.detail.key;
        const col = columns.find((col) => col.key === sortByColKey);
        sort = col.sort ? col.sort : [sortByColKey];
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
