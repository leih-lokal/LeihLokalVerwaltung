<script>
  import Router from "svelte-spa-router";
  import { location, replace } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { NotificationDisplay } from "@beyonk/svelte-notifications";
  import Navbar from "./Layout/Navbar.svelte";
  import TableEditor from "./TableEditors/TableEditor.svelte";
  import LoadingAnimation from "./LoadingAnimation.svelte";
  import connectDatabases from "./Database/connectDatabases";
  import Modal from "./Layout/Modal.svelte";

  onMount(() => {
    if ($location === "/") {
      replace("/rentals/0");
    }
  });
</script>

<NotificationDisplay />
<div class="container">
  {#await connectDatabases()}
    <LoadingAnimation />
  {:then}
    <Navbar />
    <Modal>
      <Router routes={{ "/:tab/:offset/:editId?": TableEditor }} />
    </Modal>
  {:catch error}
    {error.message}
  {/await}
</div>

<style>
  :global(body, html) {
    height: 100%;
    width: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen";
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
