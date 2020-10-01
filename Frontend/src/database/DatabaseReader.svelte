<script>
  import { onMount, onDestroy } from "svelte";
  import { notifier } from "@beyonk/svelte-notifications";

  export let database;
  let rows = [];

  database
    .fetchAllDocs()
    .then((fetchedRows) => (rows = fetchedRows))
    .catch((error) => {
      console.error(error);
      notifier.danger("Laden aus der Datenbank fehlgeschlagen!", 10000);
    });

  database.onChange((changedRows) => (rows = changedRows));

  onMount(() => database.syncAndListenForChanges());
  onDestroy(() => database.cancelSyncAndChangeListener());
</script>

<slot {rows} />
