<script>
    import AutoComplete from "simple-svelte-autocomplete";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let labelAttributes;
    export let updateAttributes = [];
    export let objectToUpdate;
    export let noResultsText;
    export let inputId;
    export let searchFunction;
    export let selectedAttributeKey;
    export let value;
</script>

<form autocomplete="off">
    <AutoComplete
        textCleanFunction={(text) => (value = text)}
        {searchFunction}
        beforeChange={(prevSelectedValue, newSelectedValue) => {
            updateAttributes.forEach((attr) => (objectToUpdate[attr] = newSelectedValue[attr]));
            dispatch('change', newSelectedValue);
        }}
        labelFunction={(item) => labelAttributes
                .filter((attr) => item[attr])
                .map((attr) => item[attr])
                .join(' - ')}
        {inputId}
        {noResultsText}
        hideArrow={true}
        selectedItem={{ [selectedAttributeKey]: value }} />
</form>
