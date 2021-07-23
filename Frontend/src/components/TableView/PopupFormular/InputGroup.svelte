<script>
  export let title = "";
</script>

<div class="outerbox">
  <div class="group">
    <h3>{title}</h3>
    <slot />
  </div>
</div>

<style>
  .outerbox {
    padding: 0.6rem;
    width: 26rem;
  }

  .group {
    border: 1px solid rgb(204, 204, 204);
    padding: 1rem;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
  }

  h3 {
    margin: 0;
    padding: 0 0 0.8em 0;
  }
</style>
