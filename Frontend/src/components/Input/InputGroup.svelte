<style>
  .outerbox {
    padding: 1rem;
    width: 22rem;
  }

  .group {
    border: 1px solid rgb(204, 204, 204);
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
