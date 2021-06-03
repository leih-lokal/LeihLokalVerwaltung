<script>
  import Checkbox from "svelte-checkbox";

  export let value;
  export let disabled = false;
  export let onChange;
</script>

<Checkbox
  size="2rem"
  {disabled}
  bind:checked={value}
  on:change={(event) => {
    if (onChange) {
      onChange(event.detail);
    }
  }}
  {...$$props}
/>
