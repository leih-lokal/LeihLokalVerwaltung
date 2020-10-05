<script>
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import { CustomerDatabase } from "../../database/Database.js";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
</script>

<DatabaseReader database={CustomerDatabase} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditCustomerPopup, {
        customer: row,
        database: CustomerDatabase,
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditCustomerPopup, {
      database: CustomerDatabase,
      createNewCustomer: true,
    })} />
