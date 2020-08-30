<script>
  export let page = 0;
</script>

<style>
  nav {
    position: sticky;
    top: 0;
    width: 100vw;
    height: 50px;
    z-index: 9999;
    background-color: rgb(0, 140, 186);
  }

  li {
    list-style-type: none;
    margin: 5px 2vw;
    font-size: 30px;
  }

  a.active {
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

<nav>
  <ul>
    <li>
      <a class={page === 0 ? 'active' : ''} href="/" on:click|preventDefault={() => (page = 0)}>
        Kunden
      </a>
    </li>
    <li>
      <a class={page === 1 ? 'active' : ''} href="/" on:click|preventDefault={() => (page = 1)}>
        Produkte
      </a>
    </li>
    <li>
      <a class={page === 2 ? 'active' : ''} href="/" on:click|preventDefault={() => (page = 2)}>
        Leihvorgänge
      </a>
    </li>
  </ul>
</nav>
