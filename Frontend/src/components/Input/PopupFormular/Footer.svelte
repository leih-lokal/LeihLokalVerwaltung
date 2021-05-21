<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let displaySaveButton = true;
  export let displayDeleteButton = true;
  export let displayCancelButton = true;
</script>

<div class="footer">
  {#if displayCancelButton}
    <button class="button-cancel" on:click|once={() => dispatch("cancel")}>Abbrechen</button>
  {/if}
  {#if displayDeleteButton}
    <button class="button-delete" on:click|once={() => dispatch("delete")}>Löschen</button>
  {/if}
  {#if displaySaveButton}
    <button class="button-save" on:click|once={() => dispatch("save")}>Speichern</button>
  {/if}
</div>

<style>
  .footer {
    height: 2rem;
    padding: 0.5rem;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
  }

  .button-delete {
    color: darkred;
  }
</style>
