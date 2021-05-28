<script>
  import { createEventDispatcher } from "svelte";
  import { restrict } from "./InputRestrictor";
  import InputTypes from "./InputTypes";

  export let id = "";
  export let readonly = false;
  export let value = "";
  export let disabled = false;
  export let multiline = false;
  export let inputType = false;

  const dispatch = createEventDispatcher();

  $: if (
    inputType === InputTypes.NUMBER &&
    typeof value !== "number" &&
    value !== ""
  ) {
    value = parseInt(value);
  }
</script>

<form autocomplete="off">
  {#if multiline}
    <textarea
      type="text"
      bind:value
      {id}
      name={id}
      {readonly}
      {disabled}
      on:input={(event) => dispatch("change", event.target.value)}
      rows="4"
    />
  {:else}
    <input
      use:restrict={inputType}
      type="text"
      bind:value
      {id}
      name={id}
      {readonly}
      {disabled}
      on:keydown={(event) =>
        event.key === "Enter" ? event.preventDefault() : event}
      on:input={(event) => dispatch("change", event.target.value)}
    />
  {/if}
</form>

<style>
  input[type="text"] {
    width: 100% !important;
    padding: 0.5rem !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    resize: vertical !important;
    height: 2.5rem !important;
  }
</style>
