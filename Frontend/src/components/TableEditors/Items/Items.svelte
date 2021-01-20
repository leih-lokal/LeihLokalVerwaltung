<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import ItemPopupFormular from "./ItemPopupFormular.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { itemDb } from "../../../utils/stores";

  const rowBackgroundColorFunction = (item) => {
    return item.highlight ?? "";
  };
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  {rowBackgroundColorFunction}
  database={$itemDb}
  popupFormularComponent={ItemPopupFormular}
/>
