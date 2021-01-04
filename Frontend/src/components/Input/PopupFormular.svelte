<script>
    import Checkbox from "svelte-checkbox";
    import SelectInput from "./SelectInput.svelte";
    import InputGroup from "./InputGroup.svelte";
    import DateInput from "./DateInput.svelte";
    import TextInput from "./TextInput.svelte";
    import AutocompleteInput from "./AutocompleteInput.svelte";
    import InputTypes from "./InputTypes";
    import { keyValueStore } from "../../utils/stores";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let popupFormularConfiguration;

    document.onkeydown = function (evt) {
        evt = evt || window.event;
        if (evt.key == "Escape") {
            dispatch("cancel");
        }
    };
</script>

<style>
    row {
        padding: 0.6rem;
        display: inline-block;
    }

    h1 {
        height: 2rem;
        padding: 0.7rem 0.7rem 0.9rem 0.7rem;
        margin: 0;
        flex-shrink: 0;
    }

    h3 {
        margin: 0;
        padding: 0;
    }

    label {
        padding: 0.5rem 0.5rem 0.5rem 0;
        display: inline-block;
    }

    .col-label {
        float: left;
        width: 40%;
    }

    .col-input {
        float: left;
        width: 60%;
    }

    .content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        flex: 1;
        flex-grow: 1;
        overflow: auto;
        min-height: 2em;
    }

    .container {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
    }

    .footer {
        height: 2rem;
        padding: 0.5rem;
        margin: 0;
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
    }

    .button-delete {
        color: darkred;
    }

    .hidden {
        display: None;
    }
</style>

<div>
    <div class="container">
        <h1>{popupFormularConfiguration.title}</h1>
        <div class="content">
            {#each popupFormularConfiguration.inputGroups as group}
                <InputGroup>
                    <row>
                        <h3>{group}</h3>
                    </row>
                    {#each popupFormularConfiguration.inputs.filter((input) => input.group === group) as input}
                        <row>
                            <div
                                class="col-label {input.hidden ? 'hidden' : ''}">
                                <label for={input.id}>{input.label}</label>
                            </div>
                            <div
                                class="col-input {input.hidden ? 'hidden' : ''}">
                                {#if input.type === InputTypes.TEXT}
                                    <TextInput
                                        id={input.id}
                                        readonly={input.readonly}
                                        bind:value={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }} />
                                {:else if input.type === InputTypes.AUTOCOMPLETE}
                                    <AutocompleteInput
                                        inputId={input.id}
                                        noResultsText={input.noResultsText}
                                        bind:value={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                                        searchFunction={input.searchFunction}
                                        suggestionFormat={input.suggestionFormat}
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }} />
                                {:else if input.type === InputTypes.CHECKBOX}
                                    <Checkbox
                                        id={input.id}
                                        name={input.id}
                                        size="2rem"
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }}
                                        bind:checked={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]} />
                                {:else if input.type === InputTypes.DATE}
                                    <DateInput
                                        bind:timeMillis={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }} />
                                {:else if input.type === InputTypes.SELECTION}
                                    <SelectInput
                                        bind:selectedValuesString={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                                        selectionOptions={input.selectionOptions}
                                        isMulti={input.isMulti}
                                        isCreatable={input.isCreatable}
                                        isClearable={input.isClearable} />
                                {/if}
                            </div>
                        </row>
                    {/each}
                </InputGroup>
            {/each}
        </div>
    </div>
    <div class="footer">
        <button
            class="button-cancel"
            on:click|once={() => dispatch('cancel')}>Abbrechen</button>
        {#if popupFormularConfiguration.displayDeleteButton}
            <button
                class="button-delete"
                on:click|once={() => dispatch('delete')}>Löschen</button>
        {/if}
        <button
            class="button-save"
            on:click|once={() => dispatch('save')}>Speichern</button>
    </div>
</div>
