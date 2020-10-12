<script>
  import similarity from "../../utils/levenshtein";

  export let rows = [];
  export let currentPage = 0;
  export let columns;

  let searchTerm = "";
  let filteredRows = [];

  function filterRows(rowsToFilter, currentSearchTerm, scoreMapping = {}) {
    const formattedSearchTerm = currentSearchTerm.toLowerCase().trim();
    if (formattedSearchTerm.length === 0) {
      rowsToFilter.sort((a, b) => {
        const scoreA = scoreMapping[a._id] ? scoreMapping[a._id] : 0;
        const scoreB = scoreMapping[b._id] ? scoreMapping[b._id] : 0;
        return scoreB - scoreA;
      });
      return rowsToFilter;
    }

    let searchTermParts = formattedSearchTerm.split(" ");
    const searchPart = searchTermParts.shift();

    let result = rowsToFilter.filter((row) => {
      let valuesContainingSearchPart = Object.keys(row)
        .filter((key) =>
          columns
            .filter((column) => !column.search || column.search !== "exclude")
            .map((column) => column.key)
            .includes(key)
        )
        .filter((key) => {
          const value = String(row[key]).toLowerCase();
          const column = columns.filter((column) => column.key === key)[0];
          if (column.search && column.search === "from_beginning") {
            return value.startsWith(searchPart);
          } else {
            return value.includes(searchPart);
          }
        })
        .map((key) => String(row[key]).toLowerCase());

      if (valuesContainingSearchPart.length === 0) {
        return false;
      } else {
        let score = 0;
        valuesContainingSearchPart.forEach((value) => (score += similarity(searchPart, value)));
        scoreMapping[row._id] = score;
        return true;
      }
    });

    currentPage = 0;
    return filterRows(result, searchTermParts.join(" "), scoreMapping);
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
