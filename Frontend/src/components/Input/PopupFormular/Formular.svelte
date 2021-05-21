<script>
  import { onMount } from "svelte";
  import Footer from "./Footer.svelte";
  import InputGroup from "./InputGroup.svelte";

  export let config = {};
  export let doc = {};
  export let createNew = false;

  let groupedInputs = [];

  $: groups = [...new Set(config.inputs.map((input) => input.group))];
  $: groups.forEach(
    (group) => (groupedInputs[group] = config.inputs.filter((input) => input.group === group))
  );

  onMount(() => {
    const injectContext = (val) => {
      if (typeof val === "function") {
        return val({ doc, createNew });
      } else {
        return val;
      }
    };
    config.title = injectContext(config.title);
    config.inputs.forEach((input) => {
      if (input.props) {
        Object.keys(input.props).forEach(
          (propKey) => (input.props[propKey] = injectContext(input.props[propKey]))
        );
      }
    });
  });
</script>

<div class="content">
  <h1>{config.title}</h1>
  {#each groups as group}
    <InputGroup title={group}>
      {#each groupedInputs[group] as input}
        <row>
          {#if input.label && input.label.length > 0}
            <div class="col-label">
              <label for={input.id}>{input.label}</label>
            </div>
          {/if}
          <div class="col-input">
            <svelte:component this={input.component} {...input.props} bind:value={doc[input.id]} />
          </div>
        </row>
      {/each}
    </InputGroup>
  {/each}
</div>
<Footer {...config.footer} />

<style>
  label {
    padding: 0.5rem 0.5rem 0.5rem 0;
    display: inline-block;
  }

  .col-label {
    float: left;
    width: 40%;
  }

  .col-input {
    float: left;
    width: 60%;
  }
  row {
    padding: 0.6rem;
    display: inline-block;
    width: 100%;
  }

  h1 {
    height: 2rem;
    padding: 0.7rem 0.7rem 0.9rem 0.7rem;
    margin: 0;
    width: 100%;
  }
  .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    flex-grow: 1;
    overflow: auto;
    min-height: 2em;
  }
</style>
