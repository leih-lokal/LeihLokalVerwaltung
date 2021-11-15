<script>
  import Notes from "./Notes/Notes.svelte";
  import Stats from "./Stats/Stats.svelte";
</script>

<div class="dashboardcontent">
  <div class="container">
    <Notes />
  </div>
  <div class="container">
    <Stats />
  </div>
</div>

<style>
  .dashboardcontent {
    width: 100%;
    height: 100%;
    background-color: rgb(230, 230, 230);
    padding: 1rem;
    box-sizing: border-box;
    overflow-y: scroll;
  }

  .container {
    padding: 0.4rem;
  }
</style>
