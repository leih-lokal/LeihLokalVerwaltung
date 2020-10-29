<script>
  export let numberOfPages;
  export let currentPage;

  let pageButtons = [];

  function calculatePageButtons(numberOfPages) {
    let allPages = [];
    for (let i = 0; i < numberOfPages; i++) {
      allPages.push(i);
    }

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
    page = Math.min(page, numberOfPages - 1);
    currentPage = page;
    calculatePageButtons(numberOfPages);
  }

  $: calculatePageButtons(numberOfPages);
</script>

<style>
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .pagination {
    display: flex;
    flex-shrink: 0;
    align-self: center;
    justify-content: space-around;
    font-size: 18px;
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

<div class="container">
  <div class="pagination">
    <a href="#/" on:click={() => setPage(currentPage - 1)}>&laquo;</a>
    {#each pageButtons as page}
      {#if typeof page === 'number'}
        <a href="#/" on:click={() => setPage(page)} class={page === currentPage ? 'active' : ''}>
          {page + 1}
        </a>
      {:else}<a href="#/" class="disabled">{page}</a>{/if}
    {/each}
    <a href="#/" on:click={() => setPage(currentPage + 1)}>&raquo;</a>
  </div>
</div>
