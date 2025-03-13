import { parseTimestampToString } from "../../utils/utils.js";
import ColorDefs from "../../components/Input/ColorDefs.js";

const backgroundColor = async (item) => item.highlight_color;
const backgroundColorStatus = async (item) =>
  item.status == "reserved" ? ColorDefs.ITEM_RESERVED : item.highlight_color;

export default [
  {
    title: "Id",
    key: "iid",
    numeric: true,
    display: (value) => String(value).padStart(4, "0"),
    search: "from_beginning",
    initialSort: 'asc',
    backgroundColor,
  },
  {
    title: "Bild",
    key: "images",
    disableSort: true,
    isImageUrl: true,
    disableSort: true,
    display: (value, record) => value.length ? value[0] : null,
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
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Typbezeichnung",
    key: "model",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Kategorie",
    key: "category",
    display: (value) => value?.join(', ') || '-',
    backgroundColor,
  },
  {
    title: "Pfand",
    key: "deposit",
    backgroundColor,
  },
  {
    title: "Anzahl Teile",
    key: "parts",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Erfasst am",
    key: "added_on",
    display: (value) => parseTimestampToString(value),
    backgroundColor,
  },
  {
    title: "Beschreibung",
    key: "description",
    disableSort: true,
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
    display: (value) => {
      if (value === "deleted") return "gelöscht";
      if (value === "instock") return "verfügbar";
      if (value === "outofstock") return "verliehen";
      if (value === "reserved") return "reserviert";
      if (value === "onbackorder") return "nicht verleihbar";
      if (value === "lost") return "verschollen";
      if (value === "repairing") return "in Reparatur";
      if (value === "forsale") return "zu verkaufen";
    },
    backgroundColor: backgroundColorStatus,
  },

  {
    title: "Anzahl Ausleihen",
    key: "rental_count",
    disableSort: true,
    displayExport: (allDocs, item_id) => allDocs.filter((doc) => doc.type === "rental" && doc.item_id === item_id).length,
    backgroundColor,
  },
];
