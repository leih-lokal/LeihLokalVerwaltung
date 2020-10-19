<script>
  import EditItemPopup from "./EditItemPopup.svelte";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
  const itemDatabase = getContext("itemDatabase");
</script>

<DatabaseReader database={itemDatabase} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    {filters}
    onRowClicked={(row) => openStyledModal(EditItemPopup, { item: row, database: itemDatabase })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditItemPopup, {
      database: itemDatabase,
      createNewItem: true,
    })} />
