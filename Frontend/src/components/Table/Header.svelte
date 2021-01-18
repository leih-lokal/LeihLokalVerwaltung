<script>
  import Icon from "fa-svelte/src/Icon.svelte";
  import { createEventDispatcher } from "svelte";
  import { faSort } from "@fortawesome/free-solid-svg-icons/faSort";
  import { faSortDown } from "@fortawesome/free-solid-svg-icons/faSortDown";
  import { faSortUp } from "@fortawesome/free-solid-svg-icons/faSortUp";

  const dispatch = createEventDispatcher();

  export let columns = [];
  export let indicateSort = [];

  let mouseOverColHeader = {};
</script>

<thead>
  <tr>
    {#each columns as col, i}
      <th
        on:mouseout={() => (mouseOverColHeader = {})}
        on:mouseover={() => {
          mouseOverColHeader = {};
          mouseOverColHeader[col.key] = true;
        }}
        on:click={() => dispatch("colHeaderClicked", col)}>
        {col.title}
        <span class="sort-indicator" class:visible={mouseOverColHeader[col.key]}>
          <Icon icon={faSort} />
        </span>
        <span
          class="sort-indicator-up"
          class:visible={indicateSort[i] === "up" && !mouseOverColHeader[col.key]}>
          <Icon icon={faSortUp} />
        </span>
        <span
          class="sort-indicator-down"
          class:visible={indicateSort[i] === "down" && !mouseOverColHeader[col.key]}>
          <Icon icon={faSortDown} />
        </span>
      </th>
    {/each}
  </tr>
</thead>

<style>
  th {
    border-bottom: 2px solid #000000;
    position: sticky;
    top: 0;
    background-color: white;
  }

  tr {
    height: 40px;
  }

  th {
    cursor: pointer;
  }

  span {
    display: none;
  }

  .visible {
    display: inline;
  }
</style>
