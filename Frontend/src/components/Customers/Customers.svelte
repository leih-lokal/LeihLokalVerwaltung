<script>
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
</script>

<DatabaseReader database={getContext('customerDatabase')} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditCustomerPopup, {
        customer: row,
        database: getContext('customerDatabase'),
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditCustomerPopup, {
      database: getContext('customerDatabase'),
      createNewCustomer: true,
    })} />
