<script>
  import { link } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
</script>

<nav>
  <ul>
    <li>
      <a use:active={"/customers"} href="/customers" use:link> Kunden </a>
    </li>
    <li>
      <a use:active={"/items"} href="/items" use:link> Gegenstände </a>
    </li>
    <li>
      <a use:active={"/rentals"} href="/rentals" use:link> Leihvorgänge </a>
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
  }

  li {
    list-style-type: none;
    margin: 5px 2vw;
    font-size: 30px;
  }

  /* Style for "active" links; need to mark this :global because the router adds the class directly */
  :global(a.active) {
    color: rgb(255, 208, 0) !important;
  }

  li:hover {
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
    display: flex;
  }
</style>
