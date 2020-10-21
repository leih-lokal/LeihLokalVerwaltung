export default {
  filters: {
    "nicht gelöscht": (item) => !item.status_on_website || item.status_on_website !== "deleted",
    gelöscht: (item) => item.status_on_website && item.status_on_website === "deleted",
    verfügbar: (item) => item.status_on_website && item.status_on_website === "instock",
    ausgeliehen: (item) => item.status_on_website && item.status_on_website === "outofstock",
    "Kategorie Küche": (item) => item.category && item.category === "Küche",
    "Kategorie Haushalt": (item) => item.category && item.category === "Haushalt",
    "Kategorie Garten": (item) => item.category && item.category === "Garten",
    "Kategorie Heimwerker": (item) => item.category && item.category === "Heimwerker",
    "Kategorie Kinder": (item) => item.category && item.category === "Kinder",
    "Kategorie Freizeit": (item) => item.category && item.category === "Freizeit",
  },
  activeByDefault: ["nicht gelöscht"],
};
