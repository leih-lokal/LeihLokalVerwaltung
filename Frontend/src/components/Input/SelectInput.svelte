<script>
    import Select from "svelte-select/src/Select.svelte";

    export let selectedValuesString = "";
    export let selectionOptions = [];
    export let isMulti = true;
    export let isCreatable = true;
    export let isClearable = true;

    const valuesToOptions = (values) => {
        return values.map(
            (value) =>
                selectionOptions.find(
                    (item) => item === value || item.value === value
                ) ?? value
        );
    };

    const selectedValuesFromString = (valueString) => {
        let selectedValues = [];
        if (valueString !== "") {
            selectedValues = valuesToOptions(valueString.split(", "));
        }
        if (!isMulti) {
            selectedValues =
                selectedValues.length === 0 ? {} : selectedValues[0];
        }
        return selectedValues;
    };

    $: selectedValuesArray = selectedValuesFromString(selectedValuesString);
</script>

<style>
    :global(.selectContainer > input) {
        cursor: pointer !important;
    }
</style>

<Select
    items={selectionOptions}
    bind:selectedValue={selectedValuesArray}
    on:select={(event) => {
        let selection = event.detail;
        if (selection) {
            if (!Array.isArray(selection)) selection = [selection];
            selectedValuesString = selection
                .map((item) => item.value)
                .join(', ');
        } else {
            selectedValuesString = '';
        }
    }}
    {isMulti}
    {isCreatable}
    {isClearable}
    placeholder={'Auswählen...'} />
