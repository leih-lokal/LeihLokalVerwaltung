import { saveParseTimestampToString } from "../../../utils/utils.js";

export default [
  {
    title: "Bild",
    key: "image",
    search: "exclude",
    isImageUrl: true,
  },
  {
    title: "Gegenstand Nr",
    key: "item_id",
    sort: function (doc) {
      return parseInt(doc.item_id, 10);
    },
    numeric: true,
    search: "from_beginning",
  },
  {
    title: "Gegenstand Name",
    key: "item_name",
  },
  {
    title: "Ausgegeben",
    key: "rented_on",
    search: "exclude",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Verlängert",
    key: "extended_on",
    search: "exclude",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Zurückerwartet",
    key: "to_return_on",
    search: "exclude",
    display: (value) => saveParseTimestampToString(value),
    sort: function (doc) {
      if (doc.returned_on && doc.returned_on !== 0) {
        // display returned rentals before not returned rentals
        return [0, doc.to_return_on];
      } else {
        return [1, doc.to_return_on];
      }
    },
    initialSort: "asc",
  },
  {
    title: "Mitarbeiter",
    search: "exclude",
    key: "passing_out_employee",
  },
  {
    title: "Kunde Nr",
    key: "customer_id",
    numeric: true,
    sort: function (doc) {
      return parseInt(doc.customer_id, 10);
    },
    search: "from_beginning",
  },
  {
    title: "Kunde Name",
    key: "name",
  },
  {
    title: "Pfand",
    key: "deposit",
    sort: function (value) {
      return parseInt(value, 10);
    },
    search: "exclude",
  },
  {
    title: "Pfand zurück",
    key: "deposit_returned",
    sort: function (doc) {
      return parseInt(doc.deposit_returned, 10);
    },
    search: "exclude",
  },
  {
    title: "Zurückgegeben",
    key: "returned_on",
    search: "exclude",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Mitarbeiter",
    key: "receiving_employee",
    search: "exclude",
  },
  {
    title: "Pfand einbehalten",
    key: "deposit_retained",
    sort: function (doc) {
      return parseInt(doc.deposit_retained, 10);
    },
    search: "exclude",
  },
  {
    title: "Grund",
    key: "deposit_retainment_reason",
    search: "exclude",
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
  },
];
