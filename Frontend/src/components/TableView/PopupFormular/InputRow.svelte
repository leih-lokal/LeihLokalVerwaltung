<script>
  export let label = "";
  export let id = "";
  export let hide = false;
</script>

{#if !hide}
  <row>
    <div class="col-label">
      <label for={id}>{label}</label>
    </div>
    <div class="col-input">
      <slot />
    </div>
  </row>
{/if}

<style>
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
  row {
    padding: 0.6rem;
    display: inline-block;
  }
</style>
