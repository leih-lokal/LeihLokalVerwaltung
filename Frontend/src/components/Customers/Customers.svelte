<script>
  import { getContext, onMount } from "svelte";
  import Table from "../Table/Table.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import Database from "../../utils/database.js";
  import columns from "./Columns.js";
  import { showNotification } from "../../utils/utils.js";

  const { open } = getContext("simple-modal");
  let rows = [];

  function updateRow(updatedRow) {
    let currentRowIndex = rows.findIndex((row) => row._id === updatedRow._id);
    if (currentRowIndex !== -1) {
      // customer modified
      rows[currentRowIndex] = { ...updatedRow };
    } else {
      // new customer created
      rows.push(updatedRow);
    }
  }

  function removeRow(idToRemove) {
    rows = rows.filter((row) => row._id !== idToRemove);
  }

  Database.fetchAllCustomers()
    .then((customers) => (rows = customers))
    .then(() =>
      Database.onCustomerChange((change) => {
        if (change.deleted) {
          removeRow(change.id);
        } else {
          updateRow(change.doc);
        }
      })
    )
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger");
    });

  function onRowClicked(customer) {
    open(EditCustomerPopup, { customer });
  }
</script>

<Table {rows} {columns} {onRowClicked} />
