export default {
  filters: {
    "nicht gelöscht": {
      required_fields: ["status"],
      selectors: {
        status: {
          $ne: "deleted",
        },
      },
    },
    gelöscht: {
      required_fields: ["status"],
      selectors: {
        status: {
          $eq: "deleted",
        },
      },
    },
    verfügbar: {
      required_fields: ["status"],
      selectors: {
        status: {
          $eq: "instock",
        },
      },
    },
    ausgeliehen: {
      required_fields: ["status"],
      selectors: {
        status: {
          $eq: "outofstock",
        },
      },
    },
    reserviert: {
      required_fields: ["status"],
      selectors: {
        status: {
          $eq: "reserved",
        },
      },
    },
    "nicht verleihbar": {
      required_fields: ["status"],
      selectors: {
        status: {
          $eq: "onbackorder",
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
