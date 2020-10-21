<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { customers } from "../../database/stores";
</script>

<DatabaseTableEditor {columns} {filters} rowStore={customers} popupComponent={EditCustomerPopup} />
