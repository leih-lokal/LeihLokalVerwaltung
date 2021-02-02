<script>
  import Select from "svelte-select/src/Select.svelte";

  export let selectedValuesString = "";
  export let selectionOptions = [];
  export let isMulti = true;
  export let isCreatable = true;
  export let isClearable = true;
  export let disabled = false;
  export let inputStyles = "cursor: pointer;";
  export let placeholder = "Auswählen...";

  const valuesToOptions = (values) => {
    return values.map(
      (value) => selectionOptions.find((item) => item === value || item.value === value) ?? value
    );
  };

  const selectedValuesFromString = (valueString) => {
    let selectedValues = [];
    if (valueString !== "") {
      selectedValues = valuesToOptions(isMulti ? valueString.split(", ") : [valueString]);
    }
    if (!isMulti) {
      selectedValues = selectedValues.length === 0 ? "" : selectedValues[0];
    }
    return selectedValues;
  };

  $: selectedValuesArray = selectedValuesFromString(selectedValuesString);
</script>

<Select
  items={selectionOptions}
  {inputStyles}
  selectedValue={selectedValuesArray.length !== 0 ? selectedValuesArray : undefined}
  on:select={(event) => {
    let selection = event.detail;
    if (selection) {
      if (!Array.isArray(selection)) selection = [selection];
      selectedValuesString = selection.map((item) => item.value).join(", ");
    } else {
      selectedValuesString = "";
    }
  }}
  on:clear={(event) => (selectedValuesString = "")}
  isDisabled={disabled}
  {isMulti}
  {isCreatable}
  {isClearable}
  {placeholder}
/>
