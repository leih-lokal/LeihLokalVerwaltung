<script>
  import { onMount, createEventDispatcher } from "svelte";
  import Editor from "cl-editor/src/Editor.svelte";

  onMount(() => {
    const textInputElement = document.getElementById("notes-content");
    textInputElement.focus();
  });

  export let heightPx;
  export let contentHtml = "";

  const actionBarHeightPx = 36;
  const dispatch = createEventDispatcher();
</script>

<Editor
  html={contentHtml}
  on:change={(evt) => {
    contentHtml = evt.detail;
    dispatch("change");
  }}
  actions={["b", "i", "u", "ul", "ol", "h1", "h2", "forecolor"]}
  height={heightPx - actionBarHeightPx + "px"}
  contentId="notes-content"
/>

<style>
  :global(#notes-content) {
    width: var(--note-width);
  }
</style>
