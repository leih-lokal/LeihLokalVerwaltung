<script>
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  import SearchFilterBar from "./SearchFilterBar.svelte";
  import Pagination from "./Pagination.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import { fade } from "svelte/transition";

  export let onRowClicked = row => {};
  export let database;
  export let columns = [];
  export let rowHeight = 40;
  export let filters = {};
  export let rowBackgroundColorFunction;
  export const refresh = () => {
    rows = database.query({
      filters: activeFilters.map(filterName => filters.filters[filterName]),
      columns: columns,
      searchTerm: searchTerm,
      currentPage: currentPage,
      rowsPerPage: rowsPerPage,
      sortBy: sortBy,
      sortReverse: sortReverse
    });
  };

  const shouldBeSortedByInitially = col => "initialSort" in col;

  let innerHeight = window.innerHeight;
  let sortBy = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).key
    : "_id";
  let sortReverse = columns.some(shouldBeSortedByInitially)
    ? columns.find(shouldBeSortedByInitially).initialSort === "desc"
    : false;
  let currentPage = 0;
  let rows = new Promise(() => {});
  $: rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
  let activeFilters = filters.activeByDefault;
  let searchTerm = "";

  function calculateNumberOfPages(rowCount, rowsPerPage) {
    const rowsOnLastPage = rowCount % rowsPerPage;
    let numberOfPages = (rowCount - rowsOnLastPage) / rowsPerPage;
    if (rowsOnLastPage > 0) numberOfPages += 1;
    return numberOfPages;
  }

  $: currentPage,
    searchTerm,
    activeFilters,
    sortBy,
    sortReverse,
    rowsPerPage,
    refresh();
</script>

<style>
  .animatecontainer {
    height: 100%;
  }

  table {
    width: 100%;
    table-layout: auto;
    position: relative;
    overflow-y: scroll;
    border-spacing: 2px 2px;
    padding: 0 5px 0 5px;
  }

  .tablecontainer {
    overflow-x: scroll;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .tablecontainer::-webkit-scrollbar {
    display: none;
  }

  :global(table tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
</style>

<svelte:window bind:innerHeight />
<div class="container">
  <SearchFilterBar
    {filters}
    onFilterOrSearchTermChange={(updatedActiveFilters, updatedSearchTerm) => {
      activeFilters = updatedActiveFilters;
      searchTerm = updatedSearchTerm;
    }} />
  {#await rows}
    <LoadingAnimation />
  {:then data}
    <div in:fade class="animatecontainer">
      <div class="tablecontainer">
        <table>
          <Header {columns} bind:sortBy bind:sortReverse />
          {#each data.rows as row (row._id)}
            <Row
              {rowBackgroundColorFunction}
              {columns}
              item={row}
              {rowHeight}
              on:click={() => onRowClicked(row)} />
          {/each}
        </table>
      </div>
      <Pagination
        numberOfPages={calculateNumberOfPages(data.count, rowsPerPage)}
        bind:currentPage />
    </div>
  {/await}
</div>
