<script>
  import { NotificationDisplay } from "@beyonk/svelte-notifications";
  import Navbar from "./Navbar.svelte";
  import Customers from "./Customers/Customers.svelte";
  import Items from "./Items/Items.svelte";
  import Rentals from "./Rentals/Rentals.svelte";
  import Modal from "svelte-simple-modal";
  import StyledModal from "./StyledModal.svelte";
  import PasswordDialog from "./PasswordDialog.svelte";
  import DatabaseConnection from "../database/DatabaseConnection.svelte";
  import { passwordStore } from "../database/passwordStore";

  let page = 0;
  let authenticated = false;

  passwordStore.subscribe((value) => {
    if (value && value.length > 0) authenticated = true;
  });
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

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>

{#if authenticated}
  <NotificationDisplay />
  <div class="container">
    <Navbar bind:page />
    <Modal>
      <StyledModal>
        <DatabaseConnection>
          {#if page === 0}
            <Customers />
          {:else if page === 1}
            <Items />
          {:else if page === 2}
            <Rentals />
          {/if}
        </DatabaseConnection>
      </StyledModal>
    </Modal>
  </div>
{:else}
  <PasswordDialog />
{/if}
