<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditItemPopup from "./EditItemPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { itemDb } from "../../../utils/stores";
  import WoocommerceClient from "ENV_WC_CLIENT";

  const woocommerceClient = new WoocommerceClient();
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  database={$itemDb}
  popupComponent={EditItemPopup} />
