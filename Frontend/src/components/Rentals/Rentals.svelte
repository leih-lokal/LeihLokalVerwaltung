<script>
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
</script>

<DatabaseReader database={getContext('rentalDatabase')} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditRentalPopup, {
        rental: row,
        database: getContext('rentalDatabase'),
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditRentalPopup, {
      database: getContext('rentalDatabase'),
      createNewRental: true,
    })} />
