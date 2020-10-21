<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { rentals } from "../../database/stores";
</script>

<DatabaseTableEditor {columns} {filters} rowStore={rentals} popupComponent={EditRentalPopup} />
