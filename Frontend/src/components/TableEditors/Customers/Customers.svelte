<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { customerDb } from "../../../utils/stores";
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  database={$customerDb}
  popupComponent={EditCustomerPopup} />
