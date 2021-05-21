<script>
  import Router from "svelte-spa-router";
  import { replace } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import { NotificationDisplay } from "@beyonk/svelte-notifications";
  import Navbar from "./Layout/Navbar.svelte";
  import TableEditor from "./TableEditors/TableEditor.svelte";
  import Settings from "./Input/SettingsFormular.svelte";
</script>

<NotificationDisplay />
<div class="container">
  <Navbar />
  <Router
    routes={{
      "/rentals": wrap({
        component: TableEditor,
        props: {
          tab: "rentals",
        },
      }),
      "/items": wrap({
        component: TableEditor,
        props: {
          tab: "items",
        },
      }),
      "/customers": wrap({
        component: TableEditor,
        props: {
          tab: "customers",
        },
      }),
      "/settings": wrap({
        component: Settings,
      }),
      "*": wrap({
        component: {},
        conditions: [
          (detail) => {
            replace("/rentals");
            return false;
          },
        ],
      }),
    }}
  />
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
