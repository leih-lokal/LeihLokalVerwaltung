<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { rentals, items } from "../../../utils/stores";

  $items.then(
    (items) =>
      (columns[0].display = (itemId) => {
        const item = items.find((item) => item._id == itemId);
        if (item && item.image) return item.image;
        else return "";
      })
  );
</script>

<DatabaseTableEditor {columns} {filters} rowStore={rentals} popupComponent={EditRentalPopup} />
