<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditRentalPopup from "./EditRentalPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { rentalDb } from "../../../utils/stores";

  function millisAtStartOfDay(millis) {
    var msPerDay = 86400 * 1000;
    return millis - (millis % msPerDay);
  }

  function isBeforeDay(m1, m2) {
    return millisAtStartOfDay(m1) < millisAtStartOfDay(m2);
  }

  function isToday(millis) {
    return (
      millisAtStartOfDay(millis) === millisAtStartOfDay(new Date().getTime())
    );
  }

  function isBeforeToday(millis) {
    return isBeforeDay(millis, new Date().getTime());
  }

  const rowBackgroundColorFunction = (item) => {
    // Heute zurückgegeben
    if (item.returned_on && isToday(item.returned_on)) {
      return "rgb(214,252,208)";
    }
    // Heute zurückerwartet
    else if (
      item.to_return_on &&
      isToday(item.to_return_on) &&
      !item.returned_on
    ) {
      return "rgb(160,200,250)";
    }
    // verspätet
    else if (
      item.to_return_on &&
      ((!item.returned_on && isBeforeToday(item.to_return_on)) ||
        (item.returned_on && isBeforeDay(item.to_return_on, item.returned_on)))
    ) {
      return "rgb(240,200,200)";
    }
  };
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  database={$rentalDb}
  {rowBackgroundColorFunction}
  popupFormularComponent={EditRentalPopup} />
