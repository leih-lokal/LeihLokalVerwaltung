<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { rentalDb } from "../../../utils/stores";
</script>

<DatabaseTableEditor {columns} {filters} database={$rentalDb} popupComponent={EditRentalPopup} />
