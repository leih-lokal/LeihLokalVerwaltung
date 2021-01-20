<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import CustomerPopupFormular from "./CustomerPopupFormular.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { customerDb } from "../../../utils/stores";

  const rowBackgroundColorFunction = (customer) => {
    return customer.highlight ?? "";
  };
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  {rowBackgroundColorFunction}
  database={$customerDb}
  popupFormularComponent={CustomerPopupFormular}
/>
