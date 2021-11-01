<script>
  import Plus from "../svgs/Plus.svelte";
</script>

<div class="addnotecontainer" on:mousedown|stopPropagation|preventDefault>
  <div class="addnote">
    <Plus />
    <div class="text">Neue Notiz</div>
  </div>
</div>

<style>
  .addnote {
    padding: 0.5rem;
    width: var(--note-width);
    height: var(--note-width);
    font-size: 1.2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  .addnotecontainer {
    padding: 1rem;
  }
</style>
