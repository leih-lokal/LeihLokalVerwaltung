<script>
  import EditItemPopup from "./EditItemPopup.svelte";
  import { ItemDatabase } from "../../database/Database.js";
  import EditableDatabaseTable from "../Table/EditableDatabaseTable.svelte";
  import columns from "./Columns.js";
</script>

<EditableDatabaseTable database={ItemDatabase} {columns} editPopup={EditItemPopup} />
