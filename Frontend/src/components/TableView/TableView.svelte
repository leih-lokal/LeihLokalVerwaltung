<script>
  import AddNewDocButton from "./AddNewDocButton.svelte";
  import SearchFilterBar from "./SearchFilterBar.svelte";
  import Pagination from "./Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import Database from "../../database/ENV_DATABASE";
  import PopupFormular from "./PopupFormular/PopupFormular.svelte";
  import { afterUpdate } from "svelte";

  export let columns = [];
  export let filters = {};
  export let docType = "";
  export let inputs = [];

  const rowHeight = 36;
  const maxRowsThatMightFitOnPage = () =>
    Math.floor((window.innerHeight - 230) / rowHeight);

  const refresh = () => {
    loadData = Database.query(
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

      // query again if a doc was created / deleted / updated
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
        return data.docs;
      })
      .catch((error) => {
        console.error(error);

        // catch again in html
        throw error;
      });
  };

  const goToFirstPage = () => {
    if (currentPage !== 0) {
      currentPage = 0;
    }
  };

  let actualRowsFittingOnPage = false;
  let rowsPerPage = maxRowsThatMightFitOnPage();
  let popupFormular;
  let searchInputRef;
  let loadData = Promise.resolve();
  let numberOfPagesPromise = new Promise(() => {});
  let searchTerm = "";
  let currentPage = 0;
  let innerHeight = window.innerHeight;
  let activeFilters = filters.activeByDefault;
  let sortByColKey = "id";
  let sortReverse;
  let sort;
  let indicateSort;
  $: innerHeight, (actualRowsFittingOnPage = false);
  $: currentPage,
    sortByColKey,
    sortReverse,
    searchTerm,
    activeFilters,
    innerHeight,
    rowsPerPage,
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
    if (actualRowsFittingOnPage === false) {
      await loadData;

      const paginationElement = document.querySelector(".pagination");
      const tableHeaderElement = document.querySelector("thead");
      const tableRowElement = document.querySelector("tbody tr");
      const rowBorderSpacing = 1;
      if (paginationElement && tableHeaderElement && tableRowElement) {
        let tableBodyHeight =
          window.innerHeight -
          paginationElement.offsetHeight -
          tableHeaderElement.getBoundingClientRect().bottom;

        actualRowsFittingOnPage = Math.floor(
          tableBodyHeight /
            (tableRowElement.getBoundingClientRect().height + rowBorderSpacing)
        );
        if (rowsPerPage !== actualRowsFittingOnPage) {
          rowsPerPage = actualRowsFittingOnPage;
        }
      }
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

<Table
  {rowHeight}
  {columns}
  {loadData}
  cellBackgroundColorsFunction={(customer) =>
    Promise.all(columns.map((column) => column.backgroundColor(customer)))}
  {indicateSort}
  onLoadDataErrorText={(error) => {
    if (error.status === 401) {
      return "Nutzer oder Passwort für die Datenbank ist nicht korrekt. Bitte in den Einstellungen (Zahnrad rechts oben) überprüfen.";
    } else {
      return `Keine Verbindung zur Datenbank. <br />${
        error.hasOwnProperty("message") ? error.message : ""
      }`;
    }
  }}
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

<Pagination {numberOfPagesPromise} bind:currentPage />

<AddNewDocButton
  on:click={() => {
    popupFormular.show({
      createNew: true,
      config: inputs,
    });
  }}
/>
