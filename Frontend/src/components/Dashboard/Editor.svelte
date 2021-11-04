<script>
  import { onMount, createEventDispatcher } from "svelte";
  import Editor from "cl-editor/src/Editor.svelte";

  onMount(() => {
    const textInputElement = document.getElementById("notes-content");
    textInputElement.focus();
  });

  export let heightPx;
  export let widthPx;
  export let contentHtml = "";

  const actionBarHeightPx = 36;
  const dispatch = createEventDispatcher();
</script>

<div
  style="--editor-width: {widthPx}px"
  on:dragstart|preventDefault|stopPropagation
>
  <Editor
    html={contentHtml}
    on:change={(evt) => {
      contentHtml = evt.detail;
      dispatch("change");
    }}
    actions={[
      "b",
      "i",
      "u",
      "ul",
      "ol",
      "h1",
      "h2",
      "forecolor",
      {
        name: "save", // required
        icon: "<b>Speichern</b>", // string or html string (ex. <svg>...</svg>)
        title: "Speichern",
        result: () => {
          dispatch("save");
        },
      },
    ]}
    height={heightPx - actionBarHeightPx + "px"}
    contentId="notes-content"
  />
</div>

<style>
  :global(#notes-content) {
    width: var(--editor-width);
  }

  :global(.cl-button:last-child) {
    width: auto !important;
    float: right;
    background-color: #8de3ff !important;
  }
</style>
