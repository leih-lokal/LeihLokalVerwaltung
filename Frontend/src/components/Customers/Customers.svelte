<script>
  import { onMount, onDestroy, getContext } from "svelte";
  import Table from "../Table/Table.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import { CustomerDatabase } from "../../database/Database.js";
  import columns from "./Columns.js";
  import { notifier } from "@beyonk/svelte-notifications";

  const { open } = getContext("simple-modal");
  let rows = [];

  CustomerDatabase.fetchAllDocs()
    .then((customers) => (rows = customers))
    .catch((error) => {
      console.error(error);
      notifier.danger("Laden aus der Datenbank fehlgeschlagen!", 10000);
    });

  CustomerDatabase.onChange((changedCustomers) => (rows = changedCustomers));

  onMount(() => CustomerDatabase.syncAndListenForChanges());
  onDestroy(() => CustomerDatabase.cancelSyncAndChangeListener());

  function onRowClicked(customer) {
    open(
      EditCustomerPopup,
      { customer },
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
