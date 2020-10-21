import { saveParseTimestampToString, saveParseStringToInt } from "../../../utils/utils.js";

export default [
  {
    title: "Gegenstand Nr",
    key: "item_id",
    sort: (value) => saveParseStringToInt(value),
    search: "from_beginning",
  },
  {
    title: "Gegenstand Name",
    key: "item_name",
  },
  {
    title: "Ausgegeben",
    key: "rented_on",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Verlängert",
    key: "extended_on",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Rückgabe",
    key: "to_return_on",
    display: (value) => saveParseTimestampToString(value),
    initialSort: "desc",
  },
  {
    title: "Mitarbeiter",
    key: "passing_out_employee",
  },
  {
    title: "Kunde Nr",
    key: "customer_id",
    sort: (value) => saveParseStringToInt(value),
    search: "from_beginning",
  },
  {
    title: "Kunde Name",
    key: "name",
  },
  {
    title: "Pfand",
    key: "deposit",
    sort: (value) => saveParseStringToInt(value),
    search: "exclude",
  },
  {
    title: "Pfand zurück",
    key: "deposit_returned",
    sort: (value) => saveParseStringToInt(value),
    search: "exclude",
  },
  {
    title: "Zurückgegeben",
    key: "returned_on",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Mitarbeiter",
    key: "receiving_employee",
  },
  {
    title: "Pfand einbehalten",
    key: "deposit_retained",
    sort: (value) => saveParseStringToInt(value),
    search: "exclude",
  },
  {
    title: "Grund",
    key: "deposit_retainment_reason",
  },
  {
    title: "Bemerkung",
    key: "remark",
  },
];
