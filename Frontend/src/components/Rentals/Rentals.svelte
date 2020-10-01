<script>
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import { RentalDatabase } from "../../database/Database.js";
  import EditableDatabaseTable from "../Table/EditableDatabaseTable.svelte";
  import columns from "./Columns.js";
</script>

<EditableDatabaseTable database={RentalDatabase} {columns} editPopup={EditRentalPopup} />
