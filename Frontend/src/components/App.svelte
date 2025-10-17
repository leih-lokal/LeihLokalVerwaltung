<script>
  import Router from "svelte-spa-router";
  import { replace } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import { NotificationDisplay } from "@beyonk/svelte-notifications";
  import Navbar from "./Layout/Navbar.svelte";
  import TableView from "./TableView/TableView.svelte";
  import Settings from "./Input/SettingsFormular.svelte";
  import config from "../data/config.js";
  import Logger from "./Logging/Logger.svelte";
  import LogView from "./Logging/LogView.svelte";
  import Dashboard from "./Dashboard/Dashboard.svelte";
  import { getApiClient } from "../utils/api";

  const routes = new Map();
  config.forEach((tableViewConfig) =>
    routes.set(
      tableViewConfig.route,
      wrap({
        component: TableView,
        props: {
          columns: tableViewConfig.columns,
          filters: tableViewConfig.filters,
          docType: tableViewConfig.docType,
          inputs: tableViewConfig.inputs,
          onData: tableViewConfig.onData,
          adapter: tableViewConfig.adapter,
        },
      }),
    ),
  );
  routes.set("/logs", LogView);
  routes.set(
    "/settings",
    wrap({
      component: Settings,
    }),
  );
  routes.set(
    "/start",
    wrap({
      component: Dashboard,
    }),
  );
  routes.set(
    "*",
    wrap({
      component: {},
      conditions: [
        (detail) => {
          replace("/start");
          return false;
        },
      ],
    }),
  );

  getApiClient(true).init();
</script>

<Logger />
<NotificationDisplay />
<div class="container">
  <Navbar
    tabs={config.map((tableEditorConfig) => ({
      title: tableEditorConfig.title,
      route: tableEditorConfig.route,
    }))}
  />
  <Router {routes} />
</div>

<style>
  :global(body, html) {
    height: 100%;
    width: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-family: Tahoma, Verdana, Segoe, sans-serif;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :global(:root) {
    --highligh-color: #b8b8b8;
    --red: #ff2c5d;
    --yellow: #ffcd58;
    --green: #00d39a;
    --blue: #008cba;
    --darkblue: #003b4e;
  }
</style>
