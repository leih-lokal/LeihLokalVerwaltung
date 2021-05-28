<script>
  import Checkbox from "svelte-checkbox";

  export let value;
  export let disabled = false;
</script>

<Checkbox size="2rem" {disabled} bind:checked={value} {...$$props} />
