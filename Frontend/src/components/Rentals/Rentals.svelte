<script>
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
  const rentalDatabase = getContext("rentalDatabase");
  const itemDatabase = getContext("itemDatabase");
  const customerDatabase = getContext("customerDatabase");
</script>

<DatabaseReader database={rentalDatabase} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditRentalPopup, {
        rental: row,
        database: rentalDatabase,
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditRentalPopup, {
      database: rentalDatabase,
      customerDatabase: customerDatabase,
      itemDatabase: itemDatabase,
      createNewRental: true,
    })} />
