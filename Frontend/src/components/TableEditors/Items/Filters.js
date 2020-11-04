export default {
  filters: {
    "nicht gelöscht": function (item) {
      return !item.status_on_website || item.status_on_website !== "deleted";
    },
    gelöscht: function (item) {
      return item.status_on_website && item.status_on_website === "deleted";
    },
    verfügbar: function (item) {
      return item.status_on_website && item.status_on_website === "instock";
    },
    ausgeliehen: function (item) {
      return item.status_on_website && item.status_on_website === "outofstock";
    },
    "Kategorie Küche": function (item) {
      return item.category && item.category === "Küche";
    },
    "Kategorie Haushalt": function (item) {
      return item.category && item.category === "Haushalt";
    },
    "Kategorie Garten": function (item) {
      return item.category && item.category === "Garten";
    },
    "Kategorie Heimwerker": function (item) {
      return item.category && item.category === "Heimwerker";
    },
    "Kategorie Kinder": function (item) {
      return item.category && item.category === "Kinder";
    },
    "Kategorie Freizeit": function (item) {
      return item.category && item.category === "Freizeit";
    },
  },
  activeByDefault: ["nicht gelöscht"],
};
