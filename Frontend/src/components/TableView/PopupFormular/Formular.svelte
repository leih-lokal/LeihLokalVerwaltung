<script>
  import { afterUpdate, onMount } from "svelte";
  import Footer from "./Footer.svelte";
  import InputGroup from "./InputGroup.svelte";

  export let config = {};
  export let doc = {};
  export let createNew = false;
  export let closePopup;

  let groupedInputs = [];
  let title = "";
  let groups = [];
  let inputContainer;
  let footerButtonsWithContext;
  let contextVars = {};
  let keys = {};

  let formRef;

  // needs to be reactive so that the injected context is updated when doc changes
  $: doc, (footerButtonsWithContext = injectContext(config.footerButtons));
  $: formRef, (footerButtonsWithContext = injectContext(config.footerButtons));
  $: keys;

  const injectContext = (val) => {
    if (typeof val === "function") {
      return val({
        doc,
        form: formRef,
        createNew,
        closePopup,
        updateDoc: (updatedDoc) => (doc = { ...doc, ...updatedDoc }),
        reloadById: (id) => (keys[id] = crypto.randomUUID()), // force-reload a component
        container: inputContainer,
        contextVars,
      });
    } else {
      return val;
    }
  };

  const isHidden = (input) => input.hidden && injectContext(input.hidden);

  function resolveVal(doc, inputDef) {
    return inputDef.hasOwnProperty("resolve")
      ? doc[inputDef.resolve(doc)]
      : doc[inputDef.id];
  }

  onMount(() => {
    if (config.onMount) {
      injectContext(config.onMount)();
    }
    title = injectContext(config.title);
    let inputs = config.inputs.map((input) => ({
      ...input,
      props: (() => {
        let props = {};
        Object.keys(input.props ?? []).forEach(
          (propKey) => (props[propKey] = injectContext(input.props[propKey])),
        );
        return props;
      })(),
    }));
    groups = [...new Set(inputs.map((input) => input.group))];
    groups.forEach(
      (group) =>
        (groupedInputs[group] = inputs.filter(
          (input) => input.group === group,
        )),
    );

    if (createNew) {
      // load initial values (e.g. first unused id when creating a new customer)
      Object.keys(config.initialValues).forEach(async (key) => {
        doc[key] = await config.initialValues[key]();
      });
    }
  });

  afterUpdate(() => {
    let inputElements = inputContainer.querySelectorAll("input,textarea");
    for (var i = 0; i < inputElements.length; i++) {
      inputElements[i].setAttribute("tabindex", i + 1);
    }
  });
</script>

<div class="container">
  <h1 class="header">{title}</h1>
  <div class="contentContainer">
    <div class="content" bind:this={inputContainer}>
      <form
        autocomplete="off"
        bind:this={formRef}
        onsubmit="event.preventDefault()"
      >
        {#each groups.filter( (group) => groupedInputs[group].some((input) => !isHidden(input)), ) as group}
          <InputGroup title={group}>
            {#each groupedInputs[group].filter((input) => !isHidden(input)) as input}
              <row>
                {#if input.label && input.label.length > 0}
                  <div class="col-label">
                    <label for={input.id}>{input.label}</label>
                  </div>
                {/if}
                <div class="col-input">
                  {#key keys[input.id]}
                    {#if input.nobind}
                      <svelte:component
                        this={input.component}
                        value={doc[input.id]}
                        {...input.props}
                        id={input.id}
                        on:change={() => (formRef.wasChecked = false)}
                      />
                    {:else}
                      <svelte:component
                        this={input.component}
                        {...input.props}
                        id={input.id}
                        bind:value={doc[input.id]}
                        on:change={() => (formRef.wasChecked = false)}
                      />
                    {/if}
                  {/key}
                </div>
              </row>
            {/each}
          </InputGroup>
        {/each}
      </form>
    </div>
  </div>
  <div class="footer">
    <Footer buttons={footerButtonsWithContext} />
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
    padding: 0.3rem 0 0.3rem 0;
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
    justify-content: center;
  }

  .contentContainer {
    display: block;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  .content {
    column-count: 2;
  }

  @media (max-width: 1045px) {
    .content {
      column-count: 1;
    }
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
