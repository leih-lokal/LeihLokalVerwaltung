<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import CustomerPopupFormular from "./CustomerPopupFormular.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { customerDb } from "../../../utils/stores";
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  database={$customerDb}
  popupFormularComponent={CustomerPopupFormular} />
