import { saveParseStringToInt, saveParseTimestampToString } from "../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    sort: (value) => saveParseStringToInt(value),
    search: "from_beginning",
  },
  {
    title: "Bild",
    key: "image",
    isImageUrl: true,
    search: "exclude",
  },
  {
    title: "Gegenstand",
    key: "item_name",
  },
  {
    title: "Marke",
    key: "brand",
  },
  {
    title: "Typbezeichnung",
    key: "itype",
  },
  {
    title: "Kategorie",
    key: "category",
  },
  {
    title: "Pfand",
    key: "deposit",
    search: "exclude",
  },
  {
    title: "Anzahl Teile",
    key: "parts",
    search: "exclude",
  },
  {
    title: "Anleitung",
    key: "manual",
    search: "exclude",
  },
  {
    title: "Verpackung",
    key: "package",
  },
  {
    title: "Erfasst am",
    key: "added",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Anzahl Ausleihen",
    key: "n_rented",
    search: "exclude",
    sort: (value) => saveParseStringToInt(value),
  },
  {
    title: "Eigenschaften",
    key: "properties",
  },
  {
    title: "Status Webseite",
    key: "status_on_website",
    display: (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "nicht verfügbar";
    },
  },
];
