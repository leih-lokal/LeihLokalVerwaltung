<script>
  import Notifications from "svelte-notifications";
  import Navbar from "./Navbar.svelte";
  import Customers from "./Customers/Customers.svelte";
  import Items from "./Items/Items.svelte";
  import Rentals from "./Rentals/Rentals.svelte";
  import Modal from "./Modal.svelte";

  let page = 0;
</script>

<style>
  :global(body, html) {
    height: 100%;
    width: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen";
  }

  :global(:root) {
    --navbar-height: 50px;
  }
</style>

<Notifications>
  <Navbar bind:page />
  <Modal>
    {#if page === 0}
      <Customers />
    {:else if page === 1}
      <Items />
    {:else if page === 2}
      <Rentals />
    {/if}
  </Modal>
</Notifications>
