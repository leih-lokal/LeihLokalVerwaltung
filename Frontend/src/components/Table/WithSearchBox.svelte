<script>
  export let rows = [];
  export let currentPage = 0;
  export let columns;

  let searchTerm = "";
  let filteredRows = [];

  function filterRows(rowsToFilter, currentSearchTerm) {
    const formattedSearchTerm = currentSearchTerm.toLowerCase().trim();
    if (formattedSearchTerm.length === 0) return rowsToFilter;

    let searchTermParts = formattedSearchTerm.split(" ");
    const searchPart = searchTermParts.shift();

    let result = rowsToFilter.filter((row) =>
      Object.keys(row)
        .filter((key) => columns.map((column) => column.key).includes(key))
        .map((key) => String(row[key]).toLowerCase())
        .some((value) => value.includes(searchPart))
    );

    currentPage = 0;
    return filterRows(result, searchTermParts.join(" "));
  }

  $: filteredRows = filterRows(rows, searchTerm);
</script>

<style>
  input {
    width: calc(100% - 20px);
    margin: 10px;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0px;
  }
</style>

<div class="container">
  <input bind:value={searchTerm} placeholder="Suche" />
  <slot rows={filteredRows} />
</div>
