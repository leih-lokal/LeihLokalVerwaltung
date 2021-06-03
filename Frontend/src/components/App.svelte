<script>
  import Router from "svelte-spa-router";
  import { replace } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import { NotificationDisplay } from "@beyonk/svelte-notifications";
  import Navbar from "./Layout/Navbar.svelte";
  import TableEditor from "./Table/TableEditor.svelte";
  import Settings from "./Input/SettingsFormular.svelte";
  import config from "../data/config.js";
  import createIndex from "../data/createIndex";
  import LoadingAnimation from "./LoadingAnimation.svelte";

  const routes = new Map();
  config.forEach((tableEditorConfig) =>
    routes.set(
      tableEditorConfig.route,
      wrap({
        component: TableEditor,
        props: {
          columns: tableEditorConfig.columns,
          filters: tableEditorConfig.filters,
          docType: tableEditorConfig.docType,
          inputs: tableEditorConfig.inputs,
        },
      })
    )
  );
  routes.set(
    "/settings",
    wrap({
      component: Settings,
    })
  );
  routes.set(
    "*",
    wrap({
      component: {},
      conditions: [
        (detail) => {
          replace(config[0].route);
          return false;
        },
      ],
    })
  );
</script>

<NotificationDisplay />
<div class="container">
  <Navbar
    tabs={config.map((tableEditorConfig) => ({
      title: tableEditorConfig.title,
      route: tableEditorConfig.route,
    }))}
  />
  {#await createIndex()}
    <LoadingAnimation />
  {:then}
    <Router {routes} />
  {/await}
</div>

<style>
  :global(body, html) {
    height: 100%;
    width: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen";
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :global(:root) {
    --red: #ff2c5d;
    --yellow: #ffcd58;
    --green: #00d39a;
    --blue: #008cba;
    --darkblue: #003b4e;
  }
</style>
