<script>
  import Plus from "../svgs/Plus.svelte";
</script>

<div class="addnotecontainer" id={"addnotecontainer"}>
  <div class="addnote" on:click={(e) => alert("wgweg")}>
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
    cursor: pointer;
  }

  .addnotecontainer {
    padding: 1rem;
  }
</style>
