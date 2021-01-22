<script>
  import { fade } from "svelte/transition";
  import { Pulse } from "svelte-loading-spinners";
</script>

<style>
  div {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -60px;
    margin-top: -60px;
  }
</style>

<div in:fade={{ duration: 800 }}>
  <Pulse size="120" color="#fc03a9" unit="px" />
</div>
