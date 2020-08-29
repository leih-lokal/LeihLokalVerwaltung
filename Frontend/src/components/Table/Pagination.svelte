<script>
  let pageButtons = [];
  let pages = [];

  export let rows;
  export let pageRows = [];
  export let rowsPerPage;
  export let currentPage = 0;

  // split data in pages for display
  function paginateRows(rows, rowsPerPage) {
    // do not repaginate when on last page
    if (pages.length > 1 && currentPage === pages.length - 1) return;

    let newPages = [];
    if (typeof rows === "undefined" || rows.length === 0) {
      newPages = [[]];
    } else {
      for (let i = 0; i < rows.length; i += rowsPerPage) {
        newPages.push(rows.slice(i, i + rowsPerPage));
      }
    }
    pages = newPages;
    setPage();
  }

  // display buttons for pages
  function calculatePageButtons() {
    const allPages = Array.from(pages.keys());

    if (allPages.length === 1) {
      pageButtons = [0];
      return;
    }

    pageButtons = [
      ...allPages.slice(Math.max(currentPage - 2, 0), Math.min(currentPage + 3, allPages.length)),
    ];

    if (!pageButtons.includes(0) && !pageButtons.includes(1)) {
      if (pageButtons.includes(2)) pageButtons.unshift(1);
      else pageButtons.unshift("...");
      pageButtons.unshift(0);
    } else if (!pageButtons.includes(0)) {
      pageButtons.unshift(0);
    }

    if (!pageButtons.includes(allPages.length - 2) && !pageButtons.includes(allPages.length - 1)) {
      if (pageButtons.includes(allPages.length - 3)) pageButtons.push(allPages.length - 2);
      else pageButtons.push("...");
      pageButtons.push(allPages.length - 1);
    } else if (!pageButtons.includes(allPages.length - 1)) {
      pageButtons.push(allPages.length - 1);
    }
  }

  function setPage(page = currentPage) {
    page = Math.max(page, 0);
    page = Math.min(page, pages.length - 1);
    currentPage = page;
    calculatePageButtons();
    pageRows = pages.length > 0 ? pages[currentPage] : [];
  }

  $: paginateRows(rows, rowsPerPage);
</script>

<style>
  .pagination {
    display: flex;
    direction: row;
    justify-content: space-between;
    position: absolute;
    margin-left: auto;
    margin-right: auto;
    font-size: 18px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    padding: 10px;
    width: 60%;
    background-color: white;
  }
  .pagination a {
    color: black;
    float: left;
    padding: 8px 16px;
    text-decoration: none;
  }
  .pagination a.active {
    background-color: #0066ff77;
    color: white;
  }
  .pagination a:hover:not(.active):not(.disabled) {
    background-color: #ddd;
  }
</style>

<div class="pagination">
  <a href="#/" on:click={() => setPage(currentPage - 1)}>&laquo;</a>
  {#each pageButtons as page}
    {#if typeof page === 'number'}
      <a href="#/" on:click={() => setPage(page)} class={page === currentPage ? 'active' : ''}>
        {page + 1}
      </a>
    {:else}
      <a href="#/" class="disabled">{page}</a>
    {/if}
  {/each}
  <a href="#/" on:click={() => setPage(currentPage + 1)}>&raquo;</a>
</div>
