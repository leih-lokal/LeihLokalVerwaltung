<script>
  import Checkbox from "svelte-checkbox";

  export let value;
</script>

<Checkbox size="2rem" bind:checked={value} {...$$props} />
