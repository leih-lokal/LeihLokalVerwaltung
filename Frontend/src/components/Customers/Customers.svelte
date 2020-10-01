<script>
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import { CustomerDatabase } from "../../database/Database.js";
  import EditableDatabaseTable from "../Table/EditableDatabaseTable.svelte";
  import columns from "./Columns.js";
</script>

<EditableDatabaseTable database={CustomerDatabase} {columns} editPopup={EditCustomerPopup} />
