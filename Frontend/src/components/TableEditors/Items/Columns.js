import { saveParseTimestampToString } from "../../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "id",
    numeric: true,
    display: (value) => String(value).padStart(4, "0"),
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
    key: "name",
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
    title: "Erfasst am",
    key: "added",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Beschreibung",
    key: "description",
    search: "exclude",
  },
  {
    title: "Synonyme",
    key: "synonyms",
  },
  {
    title: "Status",
    key: "status",
    search: "exclude",
    display: (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "verliehen";
      if (value === "onbackorder") return "nicht verleihbar";
    },
  },
];
