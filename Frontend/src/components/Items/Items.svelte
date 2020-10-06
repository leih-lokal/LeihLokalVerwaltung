<script>
  import EditItemPopup from "./EditItemPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
</script>

<DatabaseReader database={getContext('itemDatabase')} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditItemPopup, {
        item: row,
        database: getContext('itemDatabase'),
      })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditItemPopup, {
      database: getContext('itemDatabase'),
      createNewItem: true,
    })} />
