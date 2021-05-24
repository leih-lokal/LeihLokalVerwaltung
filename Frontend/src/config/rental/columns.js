import { saveParseTimestampToHumanReadableString } from "../../utils/utils.js";

export default [
  {
    title: "Bild",
    key: "image",
    search: "exclude",
    isImageUrl: true,
    disableSort: true,
  },
  {
    title: "Gegenstand Nr",
    key: "item_id",
    numeric: true,
    search: "from_beginning",
    display: async (value) => String(value).padStart(4, "0"),
  },
  {
    title: "Gegenstand Name",
    key: "item_name",
  },
  {
    title: "Ausgegeben",
    key: "rented_on",
    search: "exclude",
    display: async (value) => saveParseTimestampToHumanReadableString(value),
  },
  {
    title: "Verlängert",
    key: "extended_on",
    search: "exclude",
    display: async (value) => saveParseTimestampToHumanReadableString(value),
  },
  {
    title: "Zurückerwartet",
    key: "to_return_on",
    search: "exclude",
    display: async (value) => saveParseTimestampToHumanReadableString(value),
    sort: ["returned_on", "to_return_on", "customer_name"],
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
    search: "from_beginning",
  },
  {
    title: "Kunde Name",
    key: "customer_name",
  },
  {
    title: "Pfand",
    key: "deposit",
    search: "exclude",
  },
  {
    title: "Pfand zurück",
    key: "deposit_returned",
    search: "exclude",
  },
  {
    title: "Zurückgegeben",
    key: "returned_on",
    search: "exclude",
    display: async (value) => saveParseTimestampToHumanReadableString(value),
  },
  {
    title: "Mitarbeiter",
    key: "receiving_employee",
    search: "exclude",
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
    disableSort: true,
  },
];
