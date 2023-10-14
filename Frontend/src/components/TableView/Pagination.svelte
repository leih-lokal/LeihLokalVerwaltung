<script>
  import { Diamonds } from "svelte-loading-spinners";
  export let numberOfPagesPromise;
  export let currentPage;

  let pageButtons = [];
  let numberOfPages = 1;
  $: numberOfPagesPromise.then((n) => (numberOfPages = n));

  function calculatePageButtons(numberOfPages) {
    if (numberOfPages === 0) {
      pageButtons = [0];
    } else {
      pageButtons = [
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2,
      ];
      if (pageButtons[0] >= 3) {
        pageButtons = [0, "...", ...pageButtons];
      } else {
        while (pageButtons[0] > 0) pageButtons.unshift(pageButtons[0] - 1);
      }
      if (numberOfPages - 1 - pageButtons[pageButtons.length - 1] >= 3) {
        pageButtons = [...pageButtons, "...", numberOfPages - 1];
      } else {
        while (pageButtons[pageButtons.length - 1] < numberOfPages - 1)
          pageButtons.push(pageButtons[pageButtons.length - 1] + 1);
      }
      pageButtons = pageButtons.filter(
        (button) => button === "..." || (button >= 0 && button < numberOfPages)
      );
    }
  }

  function setPage(page = currentPage) {
    page = Math.min(page, numberOfPages - 1);
    page = Math.max(page, 0);
    currentPage = page;
  }

  $: currentPage, calculatePageButtons(numberOfPages);
</script>

<div class="container">
  <div class="pagination">
    {#await numberOfPagesPromise}
      <Diamonds size="100" color="#fc03a9" unit="px" />
    {:then numberOfPages}
      {#if numberOfPages > 1}
        <a href="#/" on:click|preventDefault={() => setPage(currentPage - 1)}
          >&laquo;</a
        >
        {#each pageButtons as pageButton}
          {#if typeof pageButton === "number"}
            <a
              href="#/"
              on:click|preventDefault={() => setPage(pageButton)}
              class={pageButton === currentPage ? "active" : ""}
            >
              {pageButton + 1}
            </a>
          {:else}<a href="#/" class="disabled" on:click|preventDefault
              >{pageButton}</a
            >{/if}
        {/each}
        <a href="#/" on:click|preventDefault={() => setPage(currentPage + 1)}
          >&raquo;</a
        >
      {/if}
    {/await}
  </div>
</div>

<style>
  .container {
    /*position: absolute;*/
    /*bottom: 0px;*/
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
  }
  .pagination {
    display: flex;
    flex-shrink: 0;
    align-self: center;
    justify-content: space-around;
    font-size: 18px;
    padding: 10px;
    width: 60%;
    background-color: transparent;
  }
  .pagination a {
    color: black;
    float: left;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 4px;
  }

  a {
    color: var(--darkblue);
  }
  .pagination a.active {
    background-color: var(--blue);
    color: white;
  }
  .pagination a:hover:not(.active):not(.disabled) {
    background-color: #ddd;
  }
</style>
