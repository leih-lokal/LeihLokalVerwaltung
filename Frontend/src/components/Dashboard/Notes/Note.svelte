<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { clickOutside } from "../../../actions/ClickOutside";
  import { observeResize } from "../../../actions/ResizeObserver";
  import TrashCan from "../../svgs/TrashCan.svelte";
  import Editor from "./Editor.svelte";

  export let content = "";
  export let timestamp = new Date().getTime();
  export let backgroundColor;
  export let id;

  const convertRemToPixels = (rem) =>
    rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

  const INITIAL_WIDTH_HEIGHT = convertRemToPixels(24);

  let editMode = false;
  let contentChanged = false;
  let noteViewElementWidth;
  let noteViewElementHeight;
  let lastNoteViewElementWidth = INITIAL_WIDTH_HEIGHT;
  let lastNoteViewElementHeight = INITIAL_WIDTH_HEIGHT;
  let initialResizeDone = false;

  const dispatch = createEventDispatcher();

  const enableEditMode = () => {
    if (!editMode) {
      editMode = true;
    }
  };

  const disableEditMode = () => {
    editMode = false;
    if (contentChanged) {
      dispatch("change", content);
      contentChanged = false;
    }
  };

  const toDateString = (date) => {
    const padZero = (value) => value.toString().padStart(2, "0");

    return `${padZero(date.getDate())}.${padZero(
      date.getMonth() + 1,
    )}.${date.getFullYear()}`;
  };

  const onTrashCanClicked = (event) => {
    if (confirm("Soll diese Notiz wirklich gelöscht werden?")) {
      dispatch("delete");
    }
  };

  const onNoteResize = () => {
    // ignore initial resize (would reset the size to initial value)
    if (initialResizeDone) {
      localStorage.setItem(
        id + "_size",
        JSON.stringify({
          width: noteViewElementWidth,
          height: noteViewElementHeight,
        }),
      );

      lastNoteViewElementWidth = noteViewElementWidth;
      lastNoteViewElementHeight = noteViewElementHeight;
    }
    initialResizeDone = true;
  };

  onMount(() => {
    const storedSize = localStorage.getItem(id + "_size");
    if (storedSize !== null) {
      let size = JSON.parse(storedSize);
      lastNoteViewElementWidth = size.width;
      lastNoteViewElementHeight = size.height;
    }
  });
</script>

<div class="notecontainer">
  <div class="note" use:clickOutside on:click_outside={disableEditMode}>
    {#if editMode}
      <Editor
        heightPx={lastNoteViewElementHeight}
        widthPx={lastNoteViewElementWidth}
        bind:contentHtml={content}
        on:change={(e) => (contentChanged = true)}
        on:save={disableEditMode}
      />
    {:else}
      <div
        class="noteview"
        style="background-color: {backgroundColor}; --note-width: {lastNoteViewElementWidth}px; --note-height: {lastNoteViewElementHeight}px"
        use:observeResize={onNoteResize}
        bind:offsetWidth={noteViewElementWidth}
        bind:offsetHeight={noteViewElementHeight}
        draggable={true}
        ondragover="return false"
        on:dragstart
        on:drop|preventDefault
      >
        <div class="noteviewcontent" on:click={enableEditMode}>
          {@html content}
          {#if content === ""}
            <div class="helptext">Zum Bearbeiten hier klicken</div>
          {/if}
        </div>
        <div class="footer">
          <div class="deletebutton">
            <TrashCan on:click={onTrashCanClicked} />
          </div>
          <div class="lastedit">
            {toDateString(new Date(timestamp))}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .note {
    display: flex;
    background-color: transparent;
  }

  .noteview {
    padding: 0.5rem 0.5rem 0.2rem 0.5rem;
    width: var(--note-width);
    height: var(--note-height);
    font-size: 1.2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    resize: both;
    overflow: auto;
  }

  .notecontainer {
    padding: 1rem;
    background-color: transparent;
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
    box-sizing: border-box;
  }

  .deletebutton:hover {
    transition: 0.25s all;
    transform: scale(1.1);
  }

  .noteviewcontent {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .helptext {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.4rem;
    font-weight: bold;
    color: rgb(120, 120, 120);
  }
</style>
