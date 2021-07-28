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
  export let labelFunction = valueFromSelected;
  export let disabled;
  export let onlyNumbers = false;
  export let onSelected = () => {};
  export let valueField;
  export let placeholder = "";
  export let singleValue = true;
  export let showClear = false;

  onMount(() =>
    restrictInputToNumbers(document.getElementById(id), onlyNumbers)
  );

  $: value = singleValue ? valueFromSelected(value) : value;
</script>

<div class="container">
  <AutoComplete
    delay={150}
    {searchFunction}
    {labelFunction}
    beforeChange={(prevSelectedValue, selectedValue) => {
      const newValue = selectedValue; //valueFromSelected(selectedValue);
      if (JSON.stringify(value) !== JSON.stringify(newValue)) {
        value = newValue;
        onSelected(value);
        return true;
      }
      // do not select same value again
      return false;
    }}
    inputId={id}
    {noResultsText}
    {placeholder}
    {showClear}
    {disabled}
    hideArrow={true}
    localSearch={false}
    localFiltering={false}
    bind:selectedItem={value}
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
    height: 2.5rem !important;
  }
</style>
