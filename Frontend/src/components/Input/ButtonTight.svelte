<script>
  export let text;
</script>

<button class="button-tight" on:click>{text}</button>

<style>
  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
    margin-left: 0.1rem;
  }
  .button-tight:hover {
    transition: 0.25s all;
    transform: scale(1.02);
  }
</style>
