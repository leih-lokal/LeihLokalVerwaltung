<script>
  import { onMount } from "svelte";
  import Footer from "./Footer.svelte";
  import InputGroup from "./InputGroup.svelte";

  export let config = {};
  export let doc = {};
  export let createNew = false;
  export let closePopup;

  let groupedInputs = [];
  let title = "";
  let groups = [];

  const injectContext = (val) => {
    if (typeof val === "function") {
      return val({ doc, createNew, closePopup });
    } else {
      return val;
    }
  };

  const isHidden = (input) => input.hidden && injectContext(input.hidden);

  onMount(() => {
    title = injectContext(config.title);
    let inputs = config.inputs.map((input) => ({
      ...input,
      props: (() => {
        let props = {};
        Object.keys(input.props ?? []).forEach(
          (propKey) => (props[propKey] = injectContext(input.props[propKey]))
        );
        return props;
      })(),
    }));
    groups = [...new Set(inputs.map((input) => input.group))];
    groups.forEach(
      (group) =>
        (groupedInputs[group] = inputs.filter((input) => input.group === group))
    );

    if (createNew) {
      // load initial values (e.g. first unused id when creating a new customer)
      Object.keys(config.initialValues).forEach((key) => {
        config.initialValues[key]().then((result) => (doc[key] = result));
      });
    }
  });
</script>

<div class="container">
  <h1 class="header">{title}</h1>
  <div class="content">
    {#each groups.filter( (group) => groupedInputs[group].some((input) => !isHidden(input)) ) as group}
      <InputGroup title={group}>
        {#each groupedInputs[group].filter((input) => !isHidden(input)) as input}
          <row>
            {#if input.label && input.label.length > 0}
              <div class="col-label">
                <label for={input.id}>{input.label}</label>
              </div>
            {/if}
            <div class="col-input">
              <svelte:component
                this={input.component}
                {...input.props}
                id={input.id}
                bind:value={doc[input.id]}
              />
            </div>
          </row>
        {/each}
      </InputGroup>
    {/each}
  </div>
  <div class="footer">
    <Footer buttons={injectContext(config.footerButtons)} />
  </div>
</div>

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
    padding: 0.6rem 0 0.6rem 0;
    display: inline-block;
    width: 100%;
  }

  h1 {
    height: 2rem;
    padding: 0;
    margin: 0;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    overflow-y: scroll;
    flex-grow: 1;
    min-height: 2em;
  }

  .header {
    flex-shrink: 0;
    width: calc(100% - 1rem);
    padding: 0.5rem 0.5rem 1rem 0.5rem;
    background-color: rgb(0, 140, 186);
    color: white;
    font-weight: normal;
  }

  .footer {
    border-top: 1px solid rgb(204, 204, 204);
    flex-shrink: 0;
  }
</style>
