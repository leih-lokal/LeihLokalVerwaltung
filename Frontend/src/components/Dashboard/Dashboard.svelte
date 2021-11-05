<script>
  import Notes from "./Notes/Notes.svelte";
</script>

<div class="dashboardcontent">
  <Notes />
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
</style>
