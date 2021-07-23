<script>
  import AutoComplete from "simple-svelte-autocomplete";
  import { onMount } from "svelte";
  import { restrictInputToNumbers } from "../../actions/RestrictInputToNumbers";

  const valueFromSelected = (selected) => {
    if (typeof selected === "object") {
      return selected[valueField ?? Object.keys(selected)[0]];
    } else {
      return selected;
    }
  };

  export let noResultsText;
  export let id;
  export let searchFunction;
  export let value;
  export let suggestionFormat = valueFromSelected;
  export let disabled;
  export let onlyNumbers = false;
  export let onSelected = () => {};
  export let valueField;

  onMount(() =>
    restrictInputToNumbers(document.getElementById(id), onlyNumbers)
  );
</script>

<div class="container">
  <AutoComplete
    delay={150}
    textCleanFunction={(text) => (value = text)}
    {searchFunction}
    labelFunction={(item) => {
      const values = Object.values(item);
      if (values.length === 0) return "";
      else if (values.length === 1 && Object.keys(item)[0] === "attr")
        return item.attr;
      else return suggestionFormat(...values);
    }}
    beforeChange={(prevSelectedValue, selectedValue) => {
      const newValue = valueFromSelected(selectedValue);
      if (value !== newValue) {
        value = newValue;
        onSelected(value);
        return true;
      }
      // do not select same value again
      return false;
    }}
    inputId={id}
    {noResultsText}
    {disabled}
    hideArrow={true}
    localSearch={false}
    localFiltering={false}
    selectedItem={{ attr: value }}
    html5autocomplete={false}
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
</style>
