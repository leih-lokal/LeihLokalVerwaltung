import { saveParseTimestampToString } from "../../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    search: "from_beginning",
    sort: function (value) {
      return parseInt(value);
    },
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
    search: "exclude",
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
    search: "exclude",
  },
  {
    title: "Erfasst am",
    key: "added",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Eigenschaften",
    key: "properties",
    search: "exclude",
  },
  {
    title: "Status Webseite",
    key: "status_on_website",
    search: "exclude",
    display: (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "verliehen";
    },
  },
];
