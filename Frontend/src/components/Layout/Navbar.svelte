<script>
  import { link, replace } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
  import TableToCSVExporter from "../TableEditors/TableToCSVExporter.svelte";
  import DropDownMenu from "./DropDownMenu.svelte";

  let tableToCSVExporterRef;
</script>

<nav>
  <ul>
    <li class="left">
      <a use:active={"/customers"} href="/customers" use:link> Kunden </a>
    </li>
    <li class="left">
      <a use:active={"/items"} href="/items" use:link> Gegenstände </a>
    </li>
    <li class="left">
      <a use:active={"/rentals"} href="/rentals" use:link> Leihvorgänge </a>
    </li>
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
    background-color: rgb(0, 140, 186);
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
    color: rgb(255, 208, 0) !important;
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
