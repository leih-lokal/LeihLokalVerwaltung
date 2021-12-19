<script>
  import Checkbox from "svelte-checkbox";

  export let value;
  export let disabled = false;
  export let onChange;
</script>

<Checkbox
  class="checkbox"
  size="1.7rem"
  {disabled}
  bind:checked={value}
  on:change={(event) => {
    if (onChange) {
      onChange(event.detail);
    }
  }}
  {...$$props}
/>

<style>
  :global(.checkbox) {
    margin-top: 0.3rem;
  }
</style>
