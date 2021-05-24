<script>
  import { link, replace } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
  import TableToCSVExporter from "../TableEditors/TableToCSVExporter.svelte";
  import DropDownMenu from "./DropDownMenu.svelte";

  export let tabs = [];
  let tableToCSVExporterRef;
</script>

<nav>
  <ul>
    {#each tabs as tab}
      <li class="left">
        <a use:active={tab.route} href={tab.route} use:link> {tab.title} </a>
      </li>
    {/each}
    <li class="right">
      <TableToCSVExporter bind:this={tableToCSVExporterRef} />
      <DropDownMenu
        menuItems={[
          {
            title: "Tabelle -> CSV",
            onClick: () => tableToCSVExporterRef.exportCSVFile(),
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
