<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import LoadingAnimation from "../LoadingAnimation.svelte";
  import SearchFilterBar from "../Input/SearchFilterBar.svelte";
  import Pagination from "../Table/Pagination.svelte";
  import Table from "../Table/Table.svelte";
  import { keyValueStore, customerDb, rentalDb, itemDb } from "../../utils/stores";
  import { isToday, isBeforeToday, isBeforeDay } from "../../utils/utils";
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";

  import CustomerPopupFormular from "./Customers/CustomerPopupFormular.svelte";
  import customerColumns from "./Customers/Columns.js";
  import customerFilters from "./Customers/Filters.js";

  import ItemPopupFormular from "./Items/ItemPopupFormular.svelte";
  import itemColumns from "./Items/Columns.js";
  import itemFilters from "./Items/Filters.js";

  import RentalPopupFormular from "./Rentals/RentalPopupFormular.svelte";
  import rentalColumns from "./Rentals/Columns.js";
  import rentalFilters from "./Rentals/Filters.js";

  export let tableEditorId;

  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(TABLE_EDITOR_CONFIG[tableEditorId].popupFormularComponent, {
      createNew: createNew,
      onSave: refresh,
    });
  };
  const shouldBeSortedByInitially = (col) => "initialSort" in col;

  const TABLE_EDITOR_CONFIG = [
    {
      columns: customerColumns,
      filters: customerFilters,
      database: $customerDb,
      popupFormularComponent: CustomerPopupFormular,
    },
    {
      columns: itemColumns,
      filters: itemFilters,
      database: $itemDb,
      popupFormularComponent: ItemPopupFormular,
    },
    {
      columns: rentalColumns,
      filters: rentalFilters,
      database: $rentalDb,
      popupFormularComponent: RentalPopupFormular,
    },
  ];

  function cellStyleFunction(col, rental) {
    if (["customer_id", "name", "item_id", "item_name"].includes(col.key)) {
      const id = col.key.includes("item") ? rental.item_id : rental.customer_id;
      const $db = col.key.includes("item") ? $itemDb : $customerDb;

      return $db.fetchById(id).then(function (doc) {
        if (doc.highlight) {
          let style = "background-color: " + doc.highlight;
          if (brightnessByColor(doc.highlight) < 125) {
            style += "; color:	#FFFFFF"; // adaptive font color for darker highlight
          }
          return style;
        } else {
          return "";
        }
      });
    }
    return Promise.resolve("");
  }

  function brightnessByColor(color) {
    var color = "" + color,
      isHEX = color.indexOf("#") == 0,
      isRGB = color.indexOf("rgb") == 0;
    if (isHEX) {
      var m = color.substr(1).match(color.length == 7 ? /(\S{2})/g : /(\S{1})/g);
      if (m)
        var r = parseInt(m[0], 16),
          g = parseInt(m[1], 16),
          b = parseInt(m[2], 16);
    }
    if (isRGB) {
      var m = color.match(/(\d+){3}/g);
      if (m)
        var r = m[0],
          g = m[1],
          b = m[2];
    }
    if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
  }

  const rowBackgroundColorFunction = (item) => {
    // Heute zurückgegeben
    if (item.returned_on && isToday(item.returned_on)) {
      return "rgb(214,252,208)";
    }
    // Heute zurückerwartet
    else if (item.to_return_on && isToday(item.to_return_on) && !item.returned_on) {
      return "rgb(160,200,250)";
    }
    // verspätet
    else if (
      item.to_return_on &&
      ((!item.returned_on && isBeforeToday(item.to_return_on)) ||
        (item.returned_on && isBeforeDay(item.to_return_on, item.returned_on)))
    ) {
      return "rgb(240,200,200)";
    }
  };

  async function calculateNumberOfPages() {
    const data = await loadData();
    const rowsOnLastPage = data.count % rowsPerPage;
    numberOfPages = (data.count - rowsOnLastPage) / rowsPerPage;
    if (rowsOnLastPage > 0) numberOfPages += 1;
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

  let loadData = new Promise(() => {});
  let searchTerm = "";
  let currentPage = 0;
  let rowHeight = 40;
  let innerHeight = window.innerHeight;
  let numberOfPages = 0;
  let activeFilters = [];
  $: columns = TABLE_EDITOR_CONFIG[tableEditorId].columns;
  $: filters = TABLE_EDITOR_CONFIG[tableEditorId].filters;
  $: database = TABLE_EDITOR_CONFIG[tableEditorId].database;
  $: sortBy = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).key
    : "_id";
  $: sortReverse = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
    : false;
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  $: tableEditorId, currentPage, sortBy, sortReverse, searchTerm, activeFilters, refresh();
  $: tableEditorId, reset();
  $: activeFilters, calculateNumberOfPages();
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
/>

{#await loadData()}
  <LoadingAnimation />
{:then data}
  <div in:fade class="animatecontainer">
    <Table
      {rowHeight}
      {columns}
      {data}
      {rowBackgroundColorFunction}
      {cellStyleFunction}
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
