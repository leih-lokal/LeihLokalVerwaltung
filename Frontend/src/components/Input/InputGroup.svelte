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
</style>

<div class="outerbox">
  <div class="group">
    <slot />
  </div>
</div>
