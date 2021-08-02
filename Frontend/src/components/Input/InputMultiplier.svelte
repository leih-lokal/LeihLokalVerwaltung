<script>
  import { beforeUpdate, onMount } from "svelte";

  export let childComponent;
  export let childComponentProps = {};
  export let firstChildComponentProps = {};
  export let initialChildComponentValue;
  export let allowAdditionalInputs = true;
  export let injectChildIndexInto;

  let childValues = [childComponentProps["value"]];
  let childProps = [];

  const isEmpty = (value) =>
    typeof value === "undefined" ||
    value === "" ||
    (typeof value === "object" &&
      Object.values(value).every((attr) => typeof attr === "undefined"));

  const showAdditionalInputIfExistingInputsAreFull = () => {
    let prevValue = childValues[childValues.length - 1];
    if (!isEmpty(prevValue)) {
      childValues = [...childValues, initialChildComponentValue];
    }
  };

  const removeInputIfTwoInputsAreEmpty = () => {
    const emptyInputCount = childValues.filter(isEmpty).length;
    if (emptyInputCount >= 2) {
      childValues = [
        ...childValues.filter((value) => !isEmpty(value)),
        initialChildComponentValue,
      ];
    }
  };

  const updateChilds = () => {
    let numberOfChildsBeforeUpdate = childValues.length;
    if (allowAdditionalInputs) {
      showAdditionalInputIfExistingInputsAreFull();
      removeInputIfTwoInputsAreEmpty();
    }
    if (childValues.length !== numberOfChildsBeforeUpdate) {
      childProps = [];
      for (let i = 0; i < childValues.length; i++) {
        childProps.push(getPropsForChild(i));
      }
    }
  };

  const getPropsForChild = (index) => {
    let props = {
      ...childComponentProps,
    };
    if (index === 0) {
      props = { ...props, ...firstChildComponentProps };
    }
    if (injectChildIndexInto) {
      props[injectChildIndexInto] = props[injectChildIndexInto](index);
    }
    return props;
  };

  beforeUpdate(updateChilds);

  onMount(() => {
    if (isEmpty(childValues[0])) {
      childValues = [initialChildComponentValue];
    }
    childProps = [getPropsForChild(0)];
  });
</script>

{#each childValues as childValue, i (i)}
  <div class="container">
    <svelte:component
      this={childComponent}
      {...childProps[i]}
      id={`${childComponentProps["id"]}_${i}`}
      bind:value={childValue}
    />
  </div>
{/each}

<style>
  .container {
    padding-bottom: 3px;
  }
</style>
