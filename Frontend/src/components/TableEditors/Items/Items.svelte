<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditItemPopup from "./EditItemPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { itemDb } from "../../../utils/stores";
</script>

<DatabaseTableEditor {columns} {filters} database={$itemDb} popupComponent={EditItemPopup} />
