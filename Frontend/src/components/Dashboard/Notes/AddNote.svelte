<script>
  import Plus from "../../svgs/Plus.svelte";
</script>

<div class="addnotecontainer" id={"addnotecontainer"}>
  <div class="addnote" on:click>
    <div class="addnotecontent">
      <Plus />
      <div class="text">Neue Notiz</div>
    </div>
  </div>
</div>

<style>
  .addnote {
    padding: 0.5rem 0.5rem 0.2rem 0.5rem;
    width: var(--note-width);
    height: var(--note-width);
    box-sizing: border-box;
    font-size: 1.2rem;
    cursor: pointer;
    border: 4px solid var(--color);
  }

  .addnote * {
    color: var(--color);
    fill: var(--color);
  }

  .addnote:hover {
    border-color: #000000;
  }

  .addnote:hover * {
    color: #000000;
    fill: #000000;
  }

  .addnote,
  .addnote * {
    -moz-transition: all 0.2s ease-in;
    -o-transition: all 0.2s ease-in;
    -webkit-transition: all 0.2s ease-in;
    transition: all 0.2s ease-in;
  }

  .addnotecontainer {
    padding: 1rem;
    --color: rgb(220, 220, 220);
  }

  .addnotecontent {
    padding: 15%;
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
  }

  .text {
    font-size: 2rem;
  }
</style>
