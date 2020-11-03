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
    sort: (value) => parseInt(value),
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
    initialSort: "desc",
  },
  {
    title: "Mitarbeiter",
    search: "exclude",
    key: "passing_out_employee",
  },
  {
    title: "Kunde Nr",
    key: "customer_id",
    sort: (value) => parseInt(value),
    search: "from_beginning",
  },
  {
    title: "Kunde Name",
    key: "name",
  },
  {
    title: "Pfand",
    key: "deposit",
    sort: (value) => parseInt(value),
    search: "exclude",
  },
  {
    title: "Pfand zurück",
    key: "deposit_returned",
    sort: (value) => parseInt(value),
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
    sort: (value) => parseInt(value),
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
