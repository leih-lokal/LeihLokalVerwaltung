import { saveParseTimestampToString } from "../../utils/utils.js";

const backgroundColor = async (customer) => customer.highlight;

export default [
  {
    title: "Id",
    key: "id",
    numeric: true,
    display: async (value) => String(value).padStart(4, "0"),
    search: "from_beginning",
    backgroundColor,
  },
  {
    title: "Bild",
    key: "image",
    isImageUrl: true,
    search: "exclude",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Gegenstand",
    key: "name",
    backgroundColor,
  },
  {
    title: "Marke",
    key: "brand",
    backgroundColor,
  },
  {
    title: "Typbezeichnung",
    key: "itype",
    backgroundColor,
  },
  {
    title: "Kategorie",
    key: "category",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Pfand",
    key: "deposit",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Anzahl Teile",
    key: "parts",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Erfasst am",
    key: "added",
    display: async (value) => saveParseTimestampToString(value),
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Beschreibung",
    key: "description",
    search: "exclude",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Synonyme",
    key: "synonyms",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Status",
    key: "status",
    search: "exclude",
    display: async (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "verliehen";
      if (value === "reserved") return "reserviert";
      if (value === "onbackorder") return "nicht verleihbar";
    },
    backgroundColor,
  },
];
