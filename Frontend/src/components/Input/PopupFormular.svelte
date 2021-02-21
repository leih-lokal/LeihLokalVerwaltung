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
</script>

<div
  on:keydown={(event) => {
    if (event.key == "ArrowLeft" || event.key == "ArrowRight") event.stopPropagation();
  }}
>
  <div class="container">
    <h1>{popupFormularConfiguration.title}</h1>
    <div class="content">
      {#each popupFormularConfiguration.inputGroups as group}
        <InputGroup>
          <row>
            <h3>{group}</h3>
          </row>
          {#each popupFormularConfiguration.inputs
            .filter((input) => !input.hidden || !input.hidden())
            .filter((input) => input.group === group) as input}
            <row>
              <div class="col-label">
                <label for={input.id}>{input.label}</label>
              </div>
              <div class="col-input">
                {#if input.type === InputTypes.TEXT}
                  <TextInput
                    inputType={input.inputType}
                    id={input.id}
                    readonly={input.readonly}
                    disabled={input.disabled}
                    multiline={input.multiline ?? false}
                    bind:value={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                    on:change={(event) => {
                      if (input.onChange) input.onChange(event.detail);
                    }}
                  />
                {:else if input.type === InputTypes.AUTOCOMPLETE}
                  <AutocompleteInput
                    inputType={input.inputType}
                    inputId={input.id}
                    disabled={input.disabled}
                    noResultsText={input.noResultsText}
                    bind:value={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                    searchFunction={input.searchFunction}
                    suggestionFormat={input.suggestionFormat}
                    on:change={(event) => {
                      if (input.onChange) input.onChange(event.detail);
                    }}
                  />
                {:else if input.type === InputTypes.CHECKBOX}
                  <Checkbox
                    id={input.id}
                    name={input.id}
                    size="2rem"
                    on:change={(event) => {
                      if (input.onChange) input.onChange(event.detail);
                    }}
                    bind:checked={$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]}
                  />
                {:else if input.type === InputTypes.DATE}
                  <DateInput
                    disabled={input.disabled}
                    quickset={input.quickset ?? {}}
                    bind:timeMillis={$keyValueStore[input.bindTo.keyValueStoreKey][
                      input.bindTo.attr
                    ]}
                    on:change={(event) => {
                      if (input.onChange) input.onChange(event.detail);
                    }}
                  />
                {:else if input.type === InputTypes.SELECTION}
                  <SelectInput
                    bind:selectedValuesString={$keyValueStore[input.bindTo.keyValueStoreKey][
                      input.bindTo.attr
                    ]}
                    selectionOptions={input.selectionOptions}
                    disabled={input.disabled}
                    isMulti={input.isMulti}
                    isCreatable={input.isCreatable}
                    isClearable={input.isClearable}
                    placeholder={input.placeholder}
                  />
                {/if}
              </div>
            </row>
          {/each}
        </InputGroup>
      {/each}
    </div>
  </div>
  <div class="footer">
    <button class="button-cancel" on:click|once={() => dispatch("cancel")}>Abbrechen</button>
    {#if popupFormularConfiguration.displayDeleteButton}
      <button class="button-delete" on:click|once={() => dispatch("delete")}>Löschen</button>
    {/if}
    <button
      class="button-save"
      on:click|once={() => {
        popupFormularConfiguration.inputs
          .filter((input) => input.inputType && input.inputType === "number")
          .forEach((input) => {
            const value = String(
              $keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]
            ).trim();
            if (value.length === 0) {
              $keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = 0;
            } else {
              $keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = parseInt(
                value,
                10
              );
            }
          });
        dispatch("save");
      }}>Speichern</button
    >
  </div>
</div>

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
