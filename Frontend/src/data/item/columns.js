import { saveParseTimestampToString } from "../../utils/utils.js";
import Database from "../../database/Database"

const backgroundColor = async (customer) => customer.highlight;

async function countRentals(item_id) {
  const selectors = [
    {
      item_id: item_id,
      type: "rental"
    },
  ];
  return await Database.countDocs(selectors);
}

export default [
  {
    title: "Id",
    key: "id",
    numeric: true,
    display: (value) => String(value).padStart(4, "0"),
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
    display: (value) => saveParseTimestampToString(value),
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
    hideInTable: true,
  },
  {
    title: "Status",
    key: "status",
    search: "exclude",
    display: (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "verliehen";
      if (value === "reserved") return "reserviert";
      if (value === "onbackorder") return "nicht verleihbar";
    },
    backgroundColor,
  },

  {
    title: "Anzahl Ausleihen",
    key: "id",
    search: "exclude",
    disableSort: true,
    display: countRentals,
    backgroundColor,
  },
];
