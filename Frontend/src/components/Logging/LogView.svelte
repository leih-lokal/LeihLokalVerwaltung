<script>
  import { loadLogs } from "./utils";

  function download() {
    var text = loadLogs().map(formatLog).join("\n");

    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute(
      "download",
      `LeihLokalVerwaltung_Logs_${new Date().getUTCDate()}_${new Date().getUTCMonth() + 1}`
    );

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  const formatLog = (log) => {
    return `${new Date(log.time).toLocaleDateString()} ${new Date(
      log.time
    ).toLocaleTimeString()} [${log.level.name}] ${log.message}`;
  };
</script>

<div class="content">
  <div class="header">
    <h1>Logs</h1>
    <button on:click={download}>Download</button>
  </div>
  {#each loadLogs() as log}
    {formatLog(log)} <br />
  {/each}
</div>

<style>
  .content {
    padding: 0 1rem 1rem 1rem;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
  }
</style>
