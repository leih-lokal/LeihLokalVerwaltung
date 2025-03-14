<script>
  import AutoComplete from "simple-svelte-autocomplete";
  import { onMount } from "svelte";
  import { restrictInputToNumbers } from "../../actions/RestrictInputToNumbers";

  export let noResultsText;
  export let id;
  export let searchFunction;
  export let value;
  export let suggestionFormat;
  export let disabled;
  export let required;
  export let onlyNumbers = false;
  export let onSelected = () => {};
  export let valueField;
  export let itemSortFunction;
  export let localFiltering;
  export let sortByMatchedKeywords;
  export let localSorting;

  onMount(() =>
    restrictInputToNumbers(document.getElementById(id), onlyNumbers),
  );
</script>

<div class="container">
  <AutoComplete
    delay={500}
    {searchFunction}
    textCleanFunction={(text) => (value = text)}
    labelFunction={(item) => {
      if (typeof item === "undefined") return "";
      const values = Object.values(item);
      if (values.length === 0) return "";
      else if (values.length === 1 && Object.keys(item)[0] === "attr")
        return item.attr;
      else if (suggestionFormat) {
        return suggestionFormat(item);
      } else {
        return item[valueField];
      }
    }}
    beforeChange={(prevSelectedObject, selectedObject) => {
      if (valueField) value = selectedObject[valueField];
      onSelected(selectedObject);
    }}
    inputId={id}
    {noResultsText}
    {disabled}
    {localSorting}
    hideArrow={true}
    {sortByMatchedKeywords}
    {itemSortFunction}
    localSearch={false}
    {localFiltering}
    valueFieldName={valueField}
    selectedItem={{ attr: value }}
    html5autocomplete={false}
    {required}
  />
</div>

<style>
  .container :global(.autocomplete) {
    width: 100%;
  }

  .container :global(.autocomplete-input) {
    border: 1px solid #ccc;
    border-radius: 4px;
    height: 2.5rem;
  }

  :global(.autocomplete-input:invalid) {
    background: #fbe9e7;
    border: 1px solid #ffccbc !important;
  }
</style>
