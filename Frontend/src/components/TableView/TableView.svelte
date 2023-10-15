<script>
  import AddNewDocButton from "./AddNewDocButton.svelte";
  import SearchFilterBar from "./SearchFilterBar.svelte";
  import Pagination from "./Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import Database from "../../database/ENV_DATABASE";
  import PopupFormular from "./PopupFormular/PopupFormular.svelte";
  import { afterUpdate, onDestroy } from "svelte";
  import Logger from "js-logger";

  export let columns = [];
  export let filters = {};
  export let docType = "";
  export let inputs = [];
  export let onData = null;
  let columnsToDisplay = [];
  $: columnsToDisplay = columns.filter((column) => !column.hideInTable);

  const rowHeight = 40;
  const maxRowsThatMightFitOnPage = () =>
    Math.floor((window.innerHeight - 230) / rowHeight);
  let popupIsOpen = false;
  let refreshWhenPopupCloses = false;
  const onPopupClosed = () => {
    popupIsOpen = false;
    if (refreshWhenPopupCloses) refresh();
  };

  const refresh = () => {
    if (!popupIsOpen) {
      refreshWhenPopupCloses = false;
      loadData = Database.query(
        {
          filters: activeFilters.map(
            (filterName) => filters.filters[filterName]
          ),
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
        .then((data) => {
          return onData ? onData(data) : data;
        })
        .catch((error) => {
          Logger.error(error);

          // catch again in html
          throw error;
        });
    } else {
      refreshWhenPopupCloses = true;
    }
  };

  const goToFirstPage = () => {
    if (currentPage !== 0) {
      currentPage = 0;
    }
  };

  let actualRowsFittingOnPage = false;
  let rowsPerPage = 25; // maxRowsThatMightFitOnPage();
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
  $: sortByColKey, sortReverse, searchTerm, activeFilters, goToFirstPage();
  $: currentPage,
    sortByColKey,
    sortReverse,
    searchTerm,
    activeFilters,
    innerHeight,
    rowsPerPage,
    refresh();
  $: indicateSort = columnsToDisplay.map((col) => {
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
          // disabled, because was causing unnecessary refreshing and didn't add too much value
          //rowsPerPage = actualRowsFittingOnPage;
        }
      }
    }
  });

  onDestroy(() => {
    Database.cancelListenerForDocType(docType);
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
  columns={columnsToDisplay}
  {loadData}
  cellBackgroundColorsFunction={(customer) =>
    Promise.all(
      columnsToDisplay.map((column) => column.backgroundColor(customer))
    )}
  {indicateSort}
  onLoadDataErrorText={(error) => {
    if (error.status === 401) {
      return "Benutzername oder Passwort für die Datenbank ist nicht korrekt. Bitte in den Einstellungen (Zahnrad rechts oben) überprüfen.";
    } else {
      return `Keine Verbindung zur Datenbank. <br />${
        error.hasOwnProperty("message") ? error.message : ""
      }`;
    }
  }}
  on:rowClicked={(event) => {
    popupIsOpen = true;
    popupFormular.show(
      {
        doc: event.detail,
        createNew: false,
        config: inputs,
      },
      onPopupClosed
    );
  }}
  on:colHeaderClicked={(event) => {
    if (sortByColKey == event.detail.key) sortReverse = !sortReverse;
    else sortReverse = false;
    sortByColKey = event.detail.key;
    const col = columnsToDisplay.find((col) => col.key === sortByColKey);
    sort = col.sort ?? [sortByColKey];
  }}
/>

<Pagination {numberOfPagesPromise} bind:currentPage />

<AddNewDocButton
  on:click={() => {
    popupIsOpen = true;
    popupFormular.show(
      {
        createNew: true,
        config: inputs,
      },
      onPopupClosed
    );
  }}
/>
