<script>
  import { RentalDatabase } from "../../database/Database.js";
  import { onMount, onDestroy, getContext } from "svelte";
  import columns from "./Columns.js";
  import Table from "../Table/Table.svelte";
  import { notifier } from "@beyonk/svelte-notifications";
  import EditRentalPopup from "./EditRentalPopup.svelte";

  const { open } = getContext("simple-modal");
  let rows = [];

  RentalDatabase.fetchAllDocs()
    .then((items) => (rows = items))
    .catch((error) => {
      console.error(error);
      notifier.danger("Laden aus der Datenbank fehlgeschlagen!", 10000);
    });

  RentalDatabase.onChange((changedItems) => (rows = changedItems));

  onMount(() => RentalDatabase.syncAndListenForChanges());
  onDestroy(() => RentalDatabase.cancelSyncAndChangeListener());

  function onRowClicked(rental) {
    open(
      EditRentalPopup,
      { rental },
      {
        closeButton: false,
        closeOnEsc: false,
        closeOnOuterClick: false,
        styleWindow: {
          width: "90%",
          "max-width": "950px",
          height: "80%",
          overflow: "hidden",
        },
        styleContent: {
          height: "100%",
        },
      }
    );
  }
</script>

<Table {rows} {columns} {onRowClicked} />
