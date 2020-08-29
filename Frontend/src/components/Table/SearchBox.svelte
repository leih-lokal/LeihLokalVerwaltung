<script>
  let searchTerm = "";
  export let rows = [];
  export let filteredRows = [];
  export let currentPage = 0;

  function filterRows(rowsToFilter, currentSearchTerm) {
    const formattedSearchTerm = currentSearchTerm.toLowerCase().trim();
    if (formattedSearchTerm.length === 0) return rowsToFilter;

    let searchTermParts = formattedSearchTerm.split(" ");
    const searchPart = searchTermParts.shift();
    let result = rowsToFilter.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(searchPart))
    );

    currentPage = 0;
    return filterRows(result, searchTermParts.join(" "));
  }

  $: filteredRows = filterRows(rows, searchTerm);
</script>

<style>
  input {
    margin: 10px;
    width: calc(100% - 20px);
  }
</style>

<input bind:value={searchTerm} placeholder="Suche" />
