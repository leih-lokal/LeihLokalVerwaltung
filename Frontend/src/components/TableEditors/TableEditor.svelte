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
  import Logger from "js-logger";
  import { afterUpdate } from "svelte";
  import Cache from "lru-cache";

  export let tab;

  const rowHeight = 40;
  const maxRowsThatMightFitOnPage = () =>
    Math.round((window.innerHeight - 250) / rowHeight);
  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(CONFIG[tab].popupFormularComponent, {
      createNew: createNew,
      onSave: refresh,
    });
  };
  const shouldBeSortedByInitially = (col) => "initialSort" in col;

  const refresh = () =>
    (loadData = Database.query({
      filters: activeFilters.map((filterName) => filters.filters[filterName]),
      columns,
      searchTerm,
      currentPage,
      rowsPerPage,
      sortBy: sort,
      sortReverse,
      docType,
    })
      .then((data) => {
        searchInputRef?.focusSearchInput();
        let cacheKey = JSON.stringify(data.docs) + innerHeight;
        if (rowsPerPageCache.has(cacheKey)) {
          // number of rows fitting on page already cached
          shouldAdaptNumberOfRows = false;
          rowsPerPage = rowsPerPageCache.get(cacheKey);
        } else if (shouldAdaptNumberOfRows) {
          // reset rowsPerPage and adapt after update
          rowsPerPage = maxRowsThatMightFitOnPage();
        }
        numberOfPagesPromise = data.count.then((count) => {
          const rowsOnLastPage = count % rowsPerPage;
          let numberOfPages = (count - rowsOnLastPage) / rowsPerPage;
          if (rowsOnLastPage > 0) numberOfPages += 1;
          return numberOfPages;
        });
        return data.docs;
      })
      .catch((error) => {
        Logger.error(error.message);
        // catch again in html
        throw error;
      }));

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

  const elementsOverlap = (topElement, bottomElement) => {
    let rect1 = topElement.getBoundingClientRect();
    let rect2 = bottomElement.getBoundingClientRect();
    return rect1.bottom - rect2.top >= 0;
  };

  const adaptNumberOfRows = () => {
    let paginationElement = document.querySelector(".pagination > a");
    if (
      tableElement &&
      paginationElement &&
      elementsOverlap(tableElement, paginationElement)
    ) {
      // prevent readapt after refresh
      shouldAdaptNumberOfRows = false;
      rowsPerPage -= 1;
    }
  };

  let tableElement;
  let rowsPerPage = maxRowsThatMightFitOnPage() - 1;
  let searchInputRef;
  let loadData = () => new Promise(() => {});
  let numberOfPagesPromise = new Promise(() => {});
  let searchTerm;
  let currentPage = 0;
  let innerHeight = window.innerHeight;
  let activeFilters = [];
  let sortByColKey;
  let sortReverse;
  let sort;
  let columns;
  let filters;
  let docType;
  let indicateSort;
  let shouldAdaptNumberOfRows = true;
  let rowsPerPageCache = new Cache(5);
  $: initNewTab(tab);
  $: tab,
    currentPage,
    sortByColKey,
    sortReverse,
    searchTerm,
    activeFilters,
    rowsPerPage,
    innerHeight,
    refresh();
  $: sortByColKey, sortReverse, searchTerm, activeFilters, goToFirstPage();
  $: indicateSort = columns.map((col) => {
    if (col.key === sortByColKey) {
      return sortReverse ? "up" : "down";
    } else {
      return "";
    }
  });

  afterUpdate(async () => {
    // wait for page buttons to be rendered to detect overlap with table
    let data = await loadData;
    let cacheKey = JSON.stringify(data) + innerHeight;
    await numberOfPagesPromise;
    if (shouldAdaptNumberOfRows) {
      setTimeout(adaptNumberOfRows, 10);
    } else {
      rowsPerPageCache.set(cacheKey, rowsPerPage);
      shouldAdaptNumberOfRows = true;
    }
  });
</script>

<svelte:window bind:innerHeight />

<SearchFilterBar
  filterOptions={Object.keys(filters.filters).map((filter) => ({
    value: filter,
    label: filter,
  }))}
  {activeFilters}
  bind:searchTerm
  on:filtersChanged={(event) => {
    if (JSON.stringify(event.detail) !== JSON.stringify(activeFilters)) {
      activeFilters = event.detail;
    }
  }}
  bind:this={searchInputRef}
/>

{#await loadData}
  <LoadingAnimation />
{:then data}
  <div in:fade class="animatecontainer">
    <Table
      bind:tableElement
      {rowHeight}
      {columns}
      {data}
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
      Nutzer oder Passwort für die Datenbank ist nicht korrekt. Bitte in den
      Einstellungen (Über Menü rechts oben) überprüfen.
    </p>
  {:else}
    <p class="error">
      Keine Verbindung mit der Datenbank. <br />{error.hasOwnProperty("message")
        ? error.message
        : ""}
    </p>
  {/if}
{/await}

<Pagination {numberOfPagesPromise} bind:currentPage />

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
