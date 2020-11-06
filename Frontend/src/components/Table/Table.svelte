<script>
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  import SearchFilterBar from "./SearchFilterBar.svelte";
  import Pagination from "./Pagination.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import { fade } from "svelte/transition";

  export let onRowClicked = (row) => {};
  export let database;
  export let columns = [];
  export let rowHeight = 40;
  export let filters = {};
  export const refresh = () => {
    rows = database.query({
      filterFunctions: activeFilters.map((filterName) => filters.filters[filterName]),
      columns: columns,
      searchTerm: searchTerm,
      currentPage: currentPage,
      rowsPerPage: rowsPerPage,
      sortBy: sortBy,
      sortReverse: sortReverse,
    });
  };

  let sortBy = columns.some((col) => "initialSort" in col)
    ? columns.find((col) => "initialSort" in col).key
    : "_id";
  let sortReverse = columns.some((col) => "initialSort" in col)
    ? columns.find((col) => "initialSort" in col).initialSort === "desc"
    : false;
  let currentPage = 0;
  let rows = new Promise(() => {});
  let rowsPerPage = Math.round((window.innerHeight - 240) / rowHeight);
  let activeFilters = filters.activeByDefault;
  let searchTerm = "";

  function calculateNumberOfPages(rowCount, rowsPerPage) {
    const rowsOnLastPage = rowCount % rowsPerPage;
    let numberOfPages = (rowCount - rowsOnLastPage) / rowsPerPage;
    if (rowsOnLastPage > 0) numberOfPages += 1;
    return numberOfPages;
  }

  $: currentPage, searchTerm, activeFilters, sortBy, sortReverse, refresh();
</script>

<style>
  div {
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

  :global(table tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
</style>

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
    <div in:fade>
      <table>
        <Header {columns} bind:sortBy bind:sortReverse />
        {#each data.rows as row}
          <Row
            {columns}
            item={row}
            {rowHeight}
            on:click={() => onRowClicked(data.rows.find((x) => x._id === row._id))} />
        {/each}
      </table>
      <Pagination
        numberOfPages={calculateNumberOfPages(data.count, rowsPerPage)}
        bind:currentPage />
    </div>
  {/await}
</div>
