<script>
  import { fade } from "svelte/transition";
  import { Pulse } from "svelte-loading-spinners";

  export let text;
  export let fullScreenOverlay = false;
  export let positionFixed = true;
  export let color = "#fc03a9";

  let containerHeight;
</script>

{#if fullScreenOverlay}
  <div class="fullscreenoverlay" />
{/if}
<div
  class="container"
  class:positionFixed
  in:fade={{ duration: 800 }}
  bind:clientHeight={containerHeight}
  style="--container-height: {containerHeight}px; --color: {color};"
>
  {#if text}
    <h1>{text}</h1>
  {/if}
  <Pulse size="120" {color} unit="px" />
</div>

<style>
  h1 {
    color: var(--color);
    text-align: center;
    padding-top: 0;
    margin-top: 0;
  }
  .container {
    width: 400px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: calc(var(--container-height) / -2);
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 20px;
    border-radius: 10px;
    background-color: transparent;
    z-index: 99999999;
  }
  .positionFixed {
    position: fixed;
  }
  .fullscreenoverlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999998;
    background-color: rgba(20, 20, 20, 0.6);
  }
</style>
