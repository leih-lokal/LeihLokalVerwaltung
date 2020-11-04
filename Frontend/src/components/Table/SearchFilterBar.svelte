<script>
  import Select from "svelte-select/src/Select";

  export let filters = {
    filters: {},
    activeByDefault: [],
  };
  export let onFilterOrSearchTermChange = (filters, searchTerm) => {};

  let searchTerm;
  let activeFilters = filters.activeByDefault;

  function handleFilterSelect(selectedVal) {
    if (!selectedVal.detail) {
      activeFilters = [];
    } else {
      activeFilters = selectedVal.detail.map((item) => item.label);
    }
    onFilterOrSearchTermChange(activeFilters, searchTerm);
  }
</script>

<style>
  .container {
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
    <input
      class="searchInput"
      bind:value={searchTerm}
      on:input={(event) => onFilterOrSearchTermChange(activeFilters, event.target.value)}
      placeholder="Suche" />
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
</div>
