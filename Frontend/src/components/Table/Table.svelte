<script>
  import Row from "./Row.svelte";
  import Header from "./Header.svelte";
  import SearchFilterBar from "./SearchFilterBar.svelte";
  import Pagination from "./Pagination.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import { fade } from "svelte/transition";

  export let onRowClicked = row => {};
  export let processRowAfterLoad;
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

  let innerHeight = window.innerHeight;
  let sortBy = columns.some(col => "initialSort" in col)
    ? columns.find(col => "initialSort" in col).key
    : "_id";
  let sortReverse = columns.some(col => "initialSort" in col)
    ? columns.find(col => "initialSort" in col).initialSort === "desc"
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
    <div in:fade>
      <table>
        <Header {columns} bind:sortBy bind:sortReverse />
        {#each data.rows as row}
          {#await processRowAfterLoad(row)}
            <Row
              {rowBackgroundColorFunction}
              {columns}
              item={row}
              {rowHeight}
              on:click={() => onRowClicked(row)} />
          {:then processedRow}
            <Row
              {rowBackgroundColorFunction}
              {columns}
              item={processedRow}
              {rowHeight}
              on:click={() => onRowClicked(processedRow)} />
          {:catch error}
            <Row
              {rowBackgroundColorFunction}
              {columns}
              item={row}
              {rowHeight}
              on:click={() => onRowClicked(row)} />
          {/await}
        {/each}
      </table>
      <Pagination
        numberOfPages={calculateNumberOfPages(data.count, rowsPerPage)}
        bind:currentPage />
    </div>
  {/await}
</div>
