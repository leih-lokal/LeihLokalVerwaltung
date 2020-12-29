<script>
    import { getContext } from "svelte";
    import Checkbox from "svelte-checkbox";
    import SelectInput from "./SelectInput.svelte";
    import InputGroup from "./InputGroup.svelte";
    import DateInput from "./DateInput.svelte";
    import TextInput from "./TextInput.svelte";
    import AutocompleteInput from "./AutocompleteInput.svelte";
    import InputTypes from "./InputTypes";
    const { close } = getContext("simple-modal");

    export let popupFormularConfiguration;
    export let createNew;
    export let doc = {};

    if (popupFormularConfiguration.createInitialDoc && createNew) {
        popupFormularConfiguration.createInitialDoc(doc);
    }
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
</style>

<div>
    <div class="container">
        <h1>
            {`${popupFormularConfiguration.docName} ${createNew ? 'anlegen' : 'bearbeiten'}`}
        </h1>
        <div class="content">
            {#each popupFormularConfiguration.inputGroups as group}
                <InputGroup>
                    <row>
                        <h3>{group}</h3>
                    </row>
                    {#each popupFormularConfiguration.inputs.filter((input) => input.group === group) as input}
                        <row>
                            <div class="col-label">
                                <label for={input.id}>{input.label}</label>
                            </div>
                            <div class="col-input">
                                {#if input.type === InputTypes.TEXT}
                                    <TextInput
                                        id={input.id}
                                        readonly={input.readonly}
                                        bindValueToObjectAttr={input.bindValueToObjectAttr}
                                        bind:bindToObject={input.bindToObject}
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }} />
                                {:else if input.type === InputTypes.AUTOCOMPLETE}
                                    <AutocompleteInput
                                        inputId={input.id}
                                        noResultsText={input.noResultsText}
                                        bind:value={doc[input.bindToDocAttribute]}
                                        labelAttributes={input.labelAttributes}
                                        searchFunction={input.searchFunction}
                                        selectedAttributeKey={input.bindToDocAttribute}
                                        updateAttributes={input.updateAttributes}
                                        bind:objectToUpdate={input.objectToUpdate}
                                        on:change={(event) => {
                                            if (input.onChange) input.onChange(event.detail);
                                        }} />
                                {:else if input.type === InputTypes.CHECKBOX}
                                    {#if input.bindToDocAttribute}
                                        <Checkbox
                                            id={input.id}
                                            name={input.id}
                                            size="2rem"
                                            on:change={(event) => {
                                                if (input.onChange) input.onChange(event.detail);
                                            }}
                                            bind:checked={doc[input.bindToDocAttribute]} />
                                    {:else}
                                        <Checkbox
                                            id={input.id}
                                            name={input.id}
                                            size="2rem"
                                            on:change={(event) => {
                                                if (input.onChange) input.onChange(event.detail);
                                            }} />
                                    {/if}
                                {:else if input.type === InputTypes.DATE}
                                    {#if input.bindToDocAttribute}
                                        <DateInput
                                            bind:timeMillis={doc[input.bindToDocAttribute]}
                                            on:change={(event) => {
                                                if (input.onChange) input.onChange(event.detail);
                                            }} />
                                    {:else}
                                        <DateInput
                                            on:change={(event) => {
                                                if (input.onChange) input.onChange(event.detail);
                                            }} />
                                    {/if}
                                {:else if input.type === InputTypes.SELECTION}
                                    {#if input.bindToDocAttribute}
                                        <SelectInput
                                            bind:selectedValuesString={doc[input.bindToDocAttribute]}
                                            selectionOptions={input.selectionOptions}
                                            isMulti={input.isMulti}
                                            isCreatable={input.isCreatable}
                                            isClearable={input.isClearable} />
                                    {:else}
                                        <SelectInput
                                            selectionOptions={input.selectionOptions}
                                            isMulti={input.isMulti}
                                            isCreatable={input.isCreatable}
                                            isClearable={input.isClearable} />
                                    {/if}
                                {/if}
                            </div>
                        </row>
                    {/each}
                </InputGroup>
            {/each}
        </div>
    </div>
    <div class="footer">
        <button class="button-cancel" on:click={close}>Abbrechen</button>
        {#if !createNew}
            <button
                class="button-delete"
                on:click={() => popupFormularConfiguration.onDeleteButtonClicked(doc, close)}>{`${popupFormularConfiguration.docName} Löschen`}</button>
        {/if}
        <button
            class="button-save"
            on:click={() => popupFormularConfiguration.onSaveButtonClicked(doc, createNew, close)}>Speichern</button>
    </div>
</div>
