<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import ItemPopupFormular from "./ItemPopupFormular.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { itemDb } from "../../../utils/stores";
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  database={$itemDb}
  popupFormularComponent={ItemPopupFormular} />
