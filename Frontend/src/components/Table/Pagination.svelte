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

<svelte:window
  on:keydown={(event) => {
    if (event.key == "ArrowLeft") {
      setPage(currentPage - 1);
    } else if (event.key == "ArrowRight") {
      setPage(currentPage + 1);
    }
  }}
/>
{#await numberOfPagesPromise}
  <div class="container">
    <div class="pagination">
      <Diamonds size="100" color="#fc03a9" unit="px" />
    </div>
  </div>
{:then numberOfPages}
  {#if numberOfPages > 1}
    <div class="container">
      <div class="pagination">
        <a href="#/" on:click|preventDefault={() => setPage(currentPage - 1)}>&laquo;</a>
        {#each pageButtons as pageButton}
          {#if typeof pageButton === "number"}
            <a
              href="#/"
              on:click|preventDefault={() => setPage(pageButton)}
              class={pageButton === currentPage ? "active" : ""}
            >
              {pageButton + 1}
            </a>
          {:else}<a href="#/" class="disabled" on:click|preventDefault>{pageButton}</a>{/if}
        {/each}
        <a href="#/" on:click|preventDefault={() => setPage(currentPage + 1)}>&raquo;</a>
      </div>
    </div>
  {/if}
{/await}

<style>
  .container {
    position: absolute;
    bottom: 0px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
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
