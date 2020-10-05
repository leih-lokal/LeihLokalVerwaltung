<script>
  import EditItemPopup from "./EditItemPopup.svelte";
  import { ItemDatabase } from "../../database/Database.js";
  import Table from "../Table/Table.svelte";
  import columns from "./Columns.js";
  import AddNewItemButton from "../AddNewItemButton.svelte";
  import DatabaseReader from "../../database/DatabaseReader.svelte";
  import { getContext } from "svelte";

  const openStyledModal = getContext("openStyledModal");
</script>

<DatabaseReader database={ItemDatabase} let:rows={loadedRows}>
  <Table
    rows={loadedRows}
    {columns}
    onRowClicked={(row) => openStyledModal(EditItemPopup, { item: row, database: ItemDatabase })} />
</DatabaseReader>

<AddNewItemButton
  on:click={() => openStyledModal(EditItemPopup, {
      database: ItemDatabase,
      createNewItem: true,
    })} />
