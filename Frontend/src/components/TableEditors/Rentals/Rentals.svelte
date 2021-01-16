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

  async function cellBackgroundColorFunction(col, item) {
    if (col.key == "customer_id" || col.key == "name" || col.key == "item_id") {
      const id = col.key == "item_id" ? item.item_id : item.customer_id;
      const $db = col.key == "item_id" ? $itemDb : $customerDb;

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
  {cellBackgroundColorFunction}
  popupFormularComponent={RentalPopupFormular}
/>
