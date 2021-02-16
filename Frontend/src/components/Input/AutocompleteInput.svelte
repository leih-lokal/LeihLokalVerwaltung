<script>
  import AutoComplete from "simple-svelte-autocomplete";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let noResultsText;
  export let inputId;
  export let searchFunction;
  export let value;
  export let suggestionFormat;
  export let disabled;
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
