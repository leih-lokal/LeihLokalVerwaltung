export default {
  filters: {
    "nicht gelöscht": {
      required_fields: ["status_on_website"],
      selectors: {
        status_on_website: {
          $ne: "deleted",
        },
      },
    },
    gelöscht: {
      required_fields: ["status_on_website"],
      selectors: {
        status_on_website: {
          $eq: "deleted",
        },
      },
    },
    verfügbar: {
      required_fields: ["status_on_website"],
      selectors: {
        status_on_website: {
          $eq: "instock",
        },
      },
    },
    ausgeliehen: {
      required_fields: ["status_on_website"],
      selectors: {
        status_on_website: {
          $eq: "outofstock",
        },
      },
    },
    "Kategorie Küche": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Küche",
        },
      },
    },
    "Kategorie Haushalt": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Haushalt",
        },
      },
    },
    "Kategorie Garten": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Garten",
        },
      },
    },
    "Kategorie Heimwerker": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Heimwerker",
        },
      },
    },
    "Kategorie Kinder": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Kinder",
        },
      },
    },
    "Kategorie Freizeit": {
      required_fields: ["category"],
      selectors: {
        category: {
          $eq: "Freizeit",
        },
      },
    },
  },
  activeByDefault: ["nicht gelöscht"],
};
