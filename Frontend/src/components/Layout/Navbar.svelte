<script>
  import { link, replace, location } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
  import DropDownMenu from "./DropDownMenu.svelte";
  import { getApiClient } from "../../utils/api";

  const apiClient = getApiClient();

  $: getCsvExportMenuItems = () => {
    const title = "Tabelle -> CSV";
    const itemType = $location.split("/")[1].slice(0, -1);

    switch (itemType) {
      case "rental":
        return [
          {
            title,
            onClick: () => apiClient.exportRentals(),
          },
        ];
      case "item":
        return [
          {
            title,
            onClick: () => apiClient.exportItems(),
          },
        ];
      case "customer":
        return [
          {
            title,
            onClick: () => apiClient.exportCustomers(),
          },
        ];
      default:
        return [];
    }
  };

  export let tabs = [];
</script>

<nav>
  <ul>
    <li class="left">
      <a use:active={"/start"} href={"/start"} use:link> {"Start"} </a>
    </li>
    {#each tabs as tab}
      <li class="left">
        <a use:active={tab.route} href={tab.route} use:link> {tab.title} </a>
      </li>
    {/each}
    <li class="right">
      <DropDownMenu
        menuItems={[
          ...getCsvExportMenuItems(),
          {
            title: "Logs",
            onClick: () => replace("/logs"),
          },
          {
            title: "Einstellungen",
            onClick: () => replace("/settings"),
          },
        ]}
      />
    </li>
  </ul>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    width: 100vw;
    height: 50px;
    background-color: var(--blue);
    z-index: 1;
  }

  li {
    list-style-type: none;
    margin: 5px 2vw;
    font-size: 30px;
  }

  li.left {
    float: left;
  }
  li.right {
    float: right;
    margin-right: 10px;
  }

  /* Style for "active" links; need to mark this :global because the router adds the class directly */
  :global(a.active),
  :global(svg.active) {
    color: var(--yellow) !important;
  }

  .left:hover {
    transition: 0.25s all;
    transform: scale(1.05);
  }

  a {
    color: white;
    text-decoration: none;
    padding: 0 2vw;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
