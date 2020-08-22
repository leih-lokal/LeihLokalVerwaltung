<script>
  import { getContext } from "svelte";
  import { onMount, onDestroy } from "svelte";
  import Table from "../Table/Table.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import { CustomerDatabase } from "../../database/Database.js";
  import columns from "./Columns.js";
  import { showNotification } from "../../utils/utils.js";

  const { open } = getContext("simple-modal");
  let rows = [];

  CustomerDatabase.fetchAllDocs()
    .then((customers) => (rows = customers))
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger");
    });

  CustomerDatabase.onChange((changedCustomers) => (rows = changedCustomers));

  onMount(() => CustomerDatabase.syncAndListenForChanges());
  onDestroy(() => CustomerDatabase.cancelSyncAndChangeListener());

  function onRowClicked(customer) {
    open(EditCustomerPopup, { customer });
  }
</script>

<Table {rows} {columns} {onRowClicked} />
