<script>
    import AutoComplete from "simple-svelte-autocomplete";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let noResultsText;
    export let inputId;
    export let searchFunction;
    export let value;
</script>

<form autocomplete="off">
    <AutoComplete
        textCleanFunction={(text) => (value = text)}
        {searchFunction}
        beforeChange={(prevSelectedValue, newSelectedValue) => {
            dispatch('change', newSelectedValue);
        }}
        labelFunction={(item) => Object.keys(item)
                .filter((attr) => item[attr])
                .map((attr) => item[attr])
                .join(' - ')}
        {inputId}
        {noResultsText}
        hideArrow={true}
        selectedItem={{ attr: value }} />
</form>
