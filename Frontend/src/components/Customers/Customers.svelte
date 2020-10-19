<script>
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
  const customerDatabase = getContext("customerDatabase");
</script>

<DatabaseReader database={customerDatabase} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    {filters}
    onRowClicked={(row) => openStyledModal(EditCustomerPopup, {
        customer: row,
        database: customerDatabase,
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditCustomerPopup, {
      database: customerDatabase,
      createNewCustomer: true,
    })} />
