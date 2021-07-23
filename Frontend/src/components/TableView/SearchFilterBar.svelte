<script>
  import SelectInput from "../Input/SelectInput.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let filterOptions = [];
  export let activeFilters = [];
  export let searchTerm = "";
  export const focusSearchInput = () => searchInputRef.focus();
  let searchInputRef;

  let undebouncedSearchTerm = "";
  let selectedValuesString = "";

  let timer;
  const debounce = (functionAfterDebounce) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      functionAfterDebounce();
    }, 750);
  };

  const selectedValuesStringFromActiveFilters = () => {
    if (selectedValuesString !== activeFilters.join(", ")) {
      selectedValuesString = activeFilters.join(", ");
    }
  };

  const activeFiltersFromSelectedValuesString = () => {
    if (selectedValuesString !== activeFilters.join(", ")) {
      activeFilters = selectedValuesString
        .split(", ")
        .filter((val) => val !== "");
      dispatch("filtersChanged", activeFilters);
    }
  };

  $: undebouncedSearchTerm = searchTerm;
  $: activeFilters, selectedValuesStringFromActiveFilters();
  $: selectedValuesString, activeFiltersFromSelectedValuesString();
</script>

<div class="container">
  <div class="searchFilterBar">
    <input
      class="searchInput"
      type="text"
      bind:this={searchInputRef}
      bind:value={undebouncedSearchTerm}
      on:input={(event) => debounce(() => (searchTerm = event.target.value))}
      placeholder="Suche"
    />
    <SelectInput
      selectionOptions={filterOptions}
      bind:value={selectedValuesString}
      placeholder={"Filter"}
      isMulti={true}
      inputStyles="font-size: 16px; cursor: pointer;"
      isCreatable={false}
    />
  </div>
</div>

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
