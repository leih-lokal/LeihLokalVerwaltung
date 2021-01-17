<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import RentalPopupFormular from "./RentalPopupFormular.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { rentalDb, customerDb, itemDb } from "../../../utils/stores";

  function millisAtStartOfDay(millis) {
    var msPerDay = 86400 * 1000;
    return millis - (millis % msPerDay);
  }

  function brightnessByColor(color) {
    var color = "" + color,
      isHEX = color.indexOf("#") == 0,
      isRGB = color.indexOf("rgb") == 0;
    if (isHEX) {
      var m = color
        .substr(1)
        .match(color.length == 7 ? /(\S{2})/g : /(\S{1})/g);
      if (m)
        var r = parseInt(m[0], 16),
          g = parseInt(m[1], 16),
          b = parseInt(m[2], 16);
    }
    if (isRGB) {
      var m = color.match(/(\d+){3}/g);
      if (m)
        var r = m[0],
          g = m[1],
          b = m[2];
    }
    if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
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

  function cellStyleFunction(col, rental) {
    if (["customer_id", "name", "item_id", "item_name"].includes(col.key)) {
      const id = col.key.includes("item") ? rental.item_id : rental.customer_id;
      const $db = col.key.includes("item") ? $itemDb : $customerDb;

      return $db.fetchById(id).then(function (doc) {
        if (doc.highlight) {
          let style = "background-color: " + doc.highlight;
          if (brightnessByColor(doc.highlight) < 125) {
            style += "; color:	#FFFFFF"; // adaptive font color for darker highlight
          }
          return style;
        } else {
          return "";
        }
      });
    }
    return Promise.resolve("");
  }

  const rowBackgroundColorFunction = (rental) => {
    // Heute zurückgegeben
    if (rental.returned_on && isToday(rental.returned_on)) {
      return "rgb(214,252,208)";
    }
    // Heute zurückerwartet
    else if (
      rental.to_return_on &&
      isToday(rental.to_return_on) &&
      !rental.returned_on
    ) {
      return "rgb(160,200,250)";
    }
    // verspätet
    else if (
      rental.to_return_on &&
      ((!rental.returned_on && isBeforeToday(rental.to_return_on)) ||
        (rental.returned_on &&
          isBeforeDay(rental.to_return_on, rental.returned_on)))
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
  {cellStyleFunction}
  popupFormularComponent={RentalPopupFormular}
/>
