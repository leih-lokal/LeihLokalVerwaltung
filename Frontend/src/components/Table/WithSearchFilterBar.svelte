<script>
  import similarity from "../../utils/levenshtein";
  import Select from "svelte-select/src/Select";

  export let rows = [];
  export let currentPage = 0;
  export let columns;
  export let filters = {
    filters: {},
    activeByDefault: [],
  };

  let searchTerm = "";
  let rowsFilteredBySearchterm = [];
  let rowsFilteredByFilters = [];
  const displayFunctions = {};
  let activeFilters = filters.activeByDefault;

  $: columns.forEach((column) => {
    if (column.display) {
      displayFunctions[column.key] = column.display;
    }
  });

  function handleFilterSelect(selectedVal) {
    if (!selectedVal.detail) {
      activeFilters = [];
    } else {
      activeFilters = selectedVal.detail.map((item) => item.label);
    }
  }

  const docsInBothLists = (list1, list2) => {
    const operation = (list1, list2, isUnion = false) =>
      list1.filter(((set) => (a) => isUnion === set.has(a._id))(new Set(list2.map((b) => b._id))));
    return operation(list1, list2, true);
  };

  const formatDisplayValue = (colKey, item) => {
    let formattedDisplayValue;
    if (!colKey in item) {
      formattedDisplayValue = "";
    } else {
      const displayFunction = columns.find((col) => col.key === colKey)["display"];
      formattedDisplayValue = displayFunction ? displayFunction(item[colKey]) : item[colKey];
    }
    return String(formattedDisplayValue).toLowerCase();
  };

  function filterRows(rowsToFilter, activeFilters) {
    rowsFilteredByFilters = rowsToFilter;
    activeFilters.forEach((activeFilter) => {
      rowsFilteredByFilters = rowsFilteredByFilters.filter((row) =>
        filters.filters[activeFilter](row)
      );
    });
  }

  function searchRows(rowsToSearch, currentSearchTerm, scoreMapping = {}) {
    const formattedSearchTerm = currentSearchTerm.toLowerCase().trim();
    if (formattedSearchTerm.length === 0) {
      rowsToSearch.sort((a, b) => {
        const scoreA = scoreMapping[a._id] ? scoreMapping[a._id] : 0;
        const scoreB = scoreMapping[b._id] ? scoreMapping[b._id] : 0;
        return scoreB - scoreA;
      });
      return rowsToSearch;
    }

    let searchTermParts = formattedSearchTerm.split(" ");
    const searchPart = searchTermParts.shift();

    let result = rowsToSearch.filter((row) => {
      let valuesContainingSearchPart = Object.keys(row)
        .filter((key) =>
          columns
            .filter((column) => !column.search || column.search !== "exclude")
            .map((column) => column.key)
            .includes(key)
        )
        .filter((key) => {
          const value = formatDisplayValue(key, row);
          const column = columns.filter((column) => column.key === key)[0];
          if (column.search && column.search === "from_beginning") {
            if (!scoreMapping[row._id]) scoreMapping[row._id] = 0;
            scoreMapping[row._id] += 1;
            return value.startsWith(searchPart);
          } else {
            return value.includes(searchPart);
          }
        })
        .map((key) => formatDisplayValue(key, row));

      if (valuesContainingSearchPart.length === 0) {
        return false;
      } else {
        if (!scoreMapping[row._id]) scoreMapping[row._id] = 0;
        valuesContainingSearchPart.forEach(
          (value) => (scoreMapping[row._id] += similarity(searchPart, value))
        );
        return true;
      }
    });

    currentPage = 0;
    return searchRows(result, searchTermParts.join(" "), scoreMapping);
  }

  $: rowsFilteredBySearchterm = searchRows(rows, searchTerm);
  $: filterRows(rows, activeFilters);
</script>

<style>
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0px;
  }

  .searchFilterBar {
    width: calc(100% - 20px);
    margin: 10px;
  }

  .searchInput {
    width: calc(50% - 35px);
    height: 42px;
    margin: 0;
    padding: 0 6px 0 16px;
    float: left;
  }

  .searchFilterBar :global(.selectContainer) {
    width: calc(50% - 35px);
    float: right;
  }
</style>

<div class="container">
  <div class="searchFilterBar">
    <input class="searchInput" bind:value={searchTerm} placeholder="Suche" />
    <Select
      items={Object.keys(filters.filters)}
      on:select={handleFilterSelect}
      selectedValue={filters.activeByDefault.length > 0 ? filters.activeByDefault : undefined}
      placeholder={'Filter'}
      isMulti={true}
      inputStyles="font-size: 16px; cursor: pointer;"
      listAutoWidth={false}
      isSearchable={false} />
  </div>
  <slot rows={docsInBothLists(rowsFilteredBySearchterm, rowsFilteredByFilters)} />
</div>
