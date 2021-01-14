<script>
  import { createEventDispatcher } from "svelte";
  import { prevent_default } from "svelte/internal";

  export let id = "";
  export let readonly = false;
  export let value = "";
  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

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

<form
  autocomplete="off"
  on:keydown={(event) => (event.key === "Enter" ? event.preventDefault() : event)}
>
  <input
    type="text"
    bind:value
    {id}
    name={id}
    {readonly}
    {disabled}
    on:input={(event) => dispatch("change", event.target.value)}
  />
</form>
