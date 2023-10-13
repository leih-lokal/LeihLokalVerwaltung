<script>
  import { createEventDispatcher, onMount } from "svelte";
  import ButtonTight from "./ButtonTight.svelte";

  export let id = "";
  export let readonly = false;
  export let value = "";
  export let required = false;
  export let pattern = null;
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

{#if multiline}
  <textarea
    bind:this={textAreaRef}
    type="text"
    bind:value
    {id}
    name={id}
    {readonly}
    {disabled}
    {required}
    {pattern}
    on:input={(event) => {
      resizeTextArea();
      dispatch("change", event.target.value);
    }}
  />
{:else}
  <input
    type="text"
    bind:value
    {id}
    name={id}
    {readonly}
    {disabled}
    {required}
    {pattern}
    on:keydown={(event) =>
      event.key === "Enter" ? event.preventDefault() : event}
    on:input={(event) => dispatch("change", event.target.value)}
  />
{/if}

{#each Object.entries(quickset) as [target, text]}
  <ButtonTight
    {text}
    on:click={() => {
      value = target;
    }}
  />
{/each}

<style>
  input {
    width: 100% !important;
    padding: 0 0.7rem 0 0.7rem !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    resize: vertical !important;
    height: 2rem !important;
    border-radius: 4px;
  }

  input:invalid {
    background: #fbe9e7;
    border: 1px solid #ffccbc !important;
  }

  textarea {
    width: 100% !important;
    resize: none;
    overflow: hidden;
  }
</style>
