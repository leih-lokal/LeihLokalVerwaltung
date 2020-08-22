import {
  saveParseStringToInt,
  saveParseTimestampToString
} from "../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    sort: (value) => saveParseStringToInt(value),
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
  },
  {
    title: "Anzahl Teile",
    key: "parts",
  },
  {
    title: "Anleitung",
    key: "manual",
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
    sort: (value) => saveParseStringToInt(value),
  },
  {
    title: "Eigenschaften",
    key: "properties",
  }
];
