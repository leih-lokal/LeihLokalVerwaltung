<script>
  import { clickOutside } from "../../actions/ClickOutside.js";

  export let menuItems = [];

  let show = false;

  // animation does not work with auto height
  let maxHeightPx = menuItems.length * 45;
</script>

<div class="dropdown" use:clickOutside on:click_outside={() => (show = false)}>
  <div on:click={() => (show = !show)} class="dropbtn">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      ><path
        fill="currentColor"
        d="M12 18c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"
      /></svg
    >
  </div>
  <div
    style="max-height: {show ? `${maxHeightPx}px` : '0'}"
    class="dropdown-content"
  >
    <ul>
      {#each menuItems as menuItem}
        <li
          on:click={() => {
            show = false;
            menuItem.onClick();
          }}
        >
          {menuItem.title}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  /* Dropdown Button */
  .dropbtn {
    color: white;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  svg {
    width: auto;
    height: 100%;
  }

  /* The container <div> - needed to position the dropdown content */
  .dropdown {
    position: relative;
    display: block;
  }

  /* Dropdown Content (Hidden by Default) */
  .dropdown-content {
    max-height: var(--max-height);
    position: absolute;
    background-color: rgb(0, 140, 186);
    color: #ffffff;
    right: 0;
    font-size: 1.4rem;
    width: 15rem;

    -webkit-transition: all 0.2s linear 0s;
    -moz-transition: all 0.2s linear 0s;
    -ms-transition: all 0.2s linear 0s;
    -o-transition: all 0.2s linear 0s;
    transition: all 0.2s linear 0s;
    overflow: hidden;
  }

  li {
    display: block;
    text-align: left;
    width: 100%;
    cursor: pointer;
    padding: 5px 10px;
    border-bottom: 1px solid white;
  }

  li:last-child {
    border-bottom: none;
  }

  li:hover {
    color: rgb(255, 208, 0);
  }

  ul {
    list-style-type: none;
    padding: 0;
  }
</style>
