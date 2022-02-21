<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { restrictInputToNumbers } from "../../actions/RestrictInputToNumbers";

  export let id = "";
  export let readonly = false;
  export let value = "";
  export let disabled = false;
  export let multiline = false;
  export let onlyNumbers = false;
  export let quickset = {};

  let textAreaRef;
  const dispatch = createEventDispatcher();

  const resizeTextArea = () => {
    if (textAreaRef) {
      textAreaRef.style.height = "10px"; // for shrinking
      textAreaRef.style.height = textAreaRef.scrollHeight + "px";
    }
  };

  onMount(resizeTextArea);
  $: if (onlyNumbers && typeof value !== "number" && value !== "") {
    value = parseInt(value);
  }
</script>

<form autocomplete="off">
  {#if multiline}
    <textarea
      bind:this={textAreaRef}
      type="text"
      bind:value
      {id}
      name={id}
      {readonly}
      {disabled}
      on:input={(event) => {
        resizeTextArea();
        dispatch("change", event.target.value);
      }}
    />
  {:else}
    <input
      use:restrictInputToNumbers={onlyNumbers}
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

{#each Object.entries(quickset) as [val, label]}
  <button
    class="button-tight"
    on:click={() => {
      value = val;
    }}>{label}</button
  >
{/each}

<style>
  input[type="text"] {
    width: 100% !important;
    padding: 0 0.7rem 0 0.7rem !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    resize: vertical !important;
    height: 2rem !important;
  }

  textarea {
    width: 100% !important;
    resize: none;
    overflow: hidden;
  }
  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
    margin-left: 0.1rem;
  }
</style>
