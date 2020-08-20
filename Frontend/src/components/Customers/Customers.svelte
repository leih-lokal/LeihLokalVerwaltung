<script>
  import { getContext } from "svelte";
  import Table from "../Table/Table.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import CustomerDatabase from "../../database/CustomerDatabase.js";
  import columns from "./Columns.js";
  import RowsProcessor from "../Table/RowsProcessor.js";
  import { showNotification } from "../../utils/utils.js";

  const { open } = getContext("simple-modal");
  const rowsProcessor = new RowsProcessor([]);
  let rows = [];

  CustomerDatabase.fetchAllCustomers()
    .then((customers) => (rows = customers))
    .then(() =>
      CustomerDatabase.onCustomerChange((change) => {
        if (change.deleted) {
          rows = rowsProcessor.removeRow(rows, change.id);
        } else {
          rows = rowsProcessor.updateRow(rows, change.doc);
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
