<script>
  import AutoComplete from "simple-svelte-autocomplete";
  import { createEventDispatcher, onMount } from "svelte";
  import { restrict } from "./InputRestrictor";

  const dispatch = createEventDispatcher();

  export let noResultsText;
  export let inputId;
  export let searchFunction;
  export let value;
  export let suggestionFormat;
  export let disabled;
  export let inputType;

  onMount(() => restrict(document.getElementById(inputId), inputType));
</script>

<form autocomplete="off">
  <AutoComplete
    textCleanFunction={(text) => (value = text)}
    {searchFunction}
    beforeChange={(prevSelectedValue, newSelectedValue) => {
      dispatch("change", newSelectedValue);
    }}
    labelFunction={(item) => {
      const values = Object.values(item);
      if (values.length === 0) return "";
      else if (values.length === 1 && Object.keys(item)[0] === "attr") return item.attr;
      else return suggestionFormat(...values);
    }}
    {inputId}
    {noResultsText}
    {disabled}
    hideArrow={true}
    selectedItem={{ attr: value }}
  />
</form>
