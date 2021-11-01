<script>
  import { createEventDispatcher } from "svelte";
  import { clickOutside } from "../../actions/ClickOutside";
  import TrashCan from "../svgs/TrashCan.svelte";
  import Editor from "./Editor.svelte";

  export let contentHtml = "";
  export let timestamp = new Date().getTime();
  export let backgroundColor;

  let editMode = false;
  let noteHeight = 300;
  let contentHeight = 300;
  let contentChanged = false;

  const dispatch = createEventDispatcher();

  const enableEditMode = () => {
    if (!editMode) {
      contentHeight = noteHeight;
      editMode = true;
    }
  };

  const disableEditMode = () => {
    editMode = false;
    if (contentChanged) {
      dispatch("change", contentHtml);
      contentChanged = false;
    }
  };

  const toDateString = (date) => {
    const padZero = (value) => value.toString().padStart(2, "0");

    return `${padZero(date.getDate())}.${padZero(
      date.getMonth() + 1
    )}.${date.getFullYear()}`;
  };

  const onTrashCanClicked = (event) => {
    if (confirm("Soll diese Notiz wirklich gelöscht werden?")) {
      dispatch("delete");
    }
  };
</script>

<div class="notecontainer">
  <div
    bind:clientHeight={noteHeight}
    class="note"
    on:click={enableEditMode}
    use:clickOutside
    on:click_outside={disableEditMode}
  >
    {#if editMode}
      <Editor
        heightPx={contentHeight}
        bind:contentHtml
        on:change={(e) => (contentChanged = true)}
      />
    {:else}
      <div class="noteview" style="background-color: {backgroundColor}">
        <div class="noteviewcontent">
          {@html contentHtml}
        </div>
        <div class="footer">
          <div class="lastedit">
            {toDateString(new Date(timestamp))}
          </div>
          <div class="deletebutton">
            <TrashCan on:click={onTrashCanClicked} />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .note {
    cursor: pointer;
    display: flex;
  }

  .noteview {
    padding: 0.5rem 0.5rem 0.2rem 0.5rem;
    width: var(--note-width);
    min-height: var(--note-width);
    font-size: 1.2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .notecontainer {
    padding: 1rem;
  }

  :global(.noteview *) {
    margin: 0;
  }

  .footer {
    font-style: italic;
    font-size: 0.9rem;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.3rem;
  }

  .deletebutton:hover {
    transition: 0.25s all;
    transform: scale(1.1);
  }
</style>
