<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import Database from "../Database/ENV_DATABASE";
  import { fade } from "svelte/transition";
  import PopupFormular from "../Input/PopupFormular/PopupFormular.svelte";

  export let columns = [];
  export let filters = [];
  export let docType = "";
  export let inputs = [];

  const refresh = () =>
    (loadData = Database.query(
      {
        filters: activeFilters.map((filterName) => filters.filters[filterName]),
        columns,
        searchTerm,
        currentPage,
        rowsPerPage,
        sortBy: sort,
        sortReverse,
        docType,
      },

      // update table if a doc returned by this query was updated
      (updatedDocs) => (loadData = Promise.resolve(updatedDocs)),

      // query again if a doc returned by this query was deleted
      refresh
    )
      .then((data) => {
        searchInputRef?.focusSearchInput();
        numberOfPagesPromise = data.count.then((count) => {
          const rowsOnLastPage = count % rowsPerPage;
          let numberOfPages = (count - rowsOnLastPage) / rowsPerPage;
          if (rowsOnLastPage > 0) numberOfPages += 1;
          return numberOfPages;
        });
        return data;
      })
      .catch((error) => console.error(error)));

  const goToFirstPage = () => {
    if (currentPage !== 0) {
      currentPage = 0;
    }
  };

  let popupFormular;
  let searchInputRef;
  let loadData = Promise.resolve();
  let numberOfPagesPromise = new Promise(() => {});
  let searchTerm = "";
  let currentPage = 0;
  let rowHeight = 40;
  let innerHeight = window.innerHeight;
  let activeFilters = [];
  let sortByColKey = "id";
  let sortReverse;
  let sort;
  let indicateSort;
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: currentPage, sortByColKey, sortReverse, searchTerm, activeFilters, refresh();
  $: sortByColKey, sortReverse, searchTerm, activeFilters, goToFirstPage();
  $: indicateSort = columns.map((col) => {
    if (col.key === sortByColKey) {
      return sortReverse ? "up" : "down";
    } else {
      return "";
    }
  });

  const shouldBeSortedByInitially = (col) => "initialSort" in col;

  const setInitialSortCol = () => {
    sortByColKey = columns.find(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).key
      : sortByColKey;
    const col = columns.find((col) => col.key === sortByColKey);
    sort = col.sort ? col.sort : [sortByColKey];
  };

  const setInitialSortDirection = () =>
    (sortReverse = columns.some(shouldBeSortedByInitially)
      ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
      : false);
  activeFilters = filters.activeByDefault;

  setInitialSortCol();
  setInitialSortDirection();
</script>

<svelte:window bind:innerHeight />

<PopupFormular bind:this={popupFormular} />

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

{#await loadData}
  <LoadingAnimation />
{:then data}
  <div in:fade class="animatecontainer">
    <Table
      {rowHeight}
      {columns}
      data={data.docs}
      cellBackgroundColorsFunction={(customer) =>
        Promise.all(columns.map(async (column) => await column.backgroundColor(customer)))}
      {indicateSort}
      on:rowClicked={(event) => {
        popupFormular.show({
          doc: event.detail,
          createNew: false,
          config: inputs,
        });
      }}
      on:colHeaderClicked={(event) => {
        if (sortByColKey == event.detail.key) sortReverse = !sortReverse;
        else sortReverse = false;
        sortByColKey = event.detail.key;
        const col = columns.find((col) => col.key === sortByColKey);
        sort = col.sort ?? [sortByColKey];
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
      Keine Verbindung zur Datenbank. <br />{error.hasOwnProperty("message") ? error.message : ""}
    </p>
  {/if}
{/await}

<Pagination {numberOfPagesPromise} bind:currentPage />

<AddNewItemButton
  on:click={() => {
    popupFormular.show({
      createNew: true,
      config: inputs,
    });
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
