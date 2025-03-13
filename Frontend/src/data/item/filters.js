const STATUSES = [
  'instock', 'deleted', 'outofstock', 'onbackorder', 'lost', 'repairing', 'forsale', 'reserved',
]

export default {
  filters: {
    "nicht gelöscht": {
      status: STATUSES.filter(s => s !== 'deleted'),
    },
    "gelöscht": {
      status: ['deleted'],
    },
    "verfügbar": {
      status: ['instock'],
    },
    "ausgeliehen": {
      status: ['outofstock'],
    },
    "reserviert": {
      status: ['reserved'],
    },
    "nicht verleihbar": {
      status: ['onbackorder'],
    },
    "verschollen": {
      status: ['lost'],
    },
    "in Reparatur": {
      status: ['repairing']
    },
    "zu verkaufen": {
      required_fields: ["status"],
      status: ['forsale'],
    },
    "Kategorie Küche": {
      category: ['Küche'],
    },
    "Kategorie Haushalt": {
      category: ['Haushalt'],
    },
    "Kategorie Garten": {
      category: ['Garten'],
    },
    "Kategorie Heimwerker": {
      category: ['Heimwerker'],
    },
    "Kategorie Kinder": {
      category: ['Kinder'],
    },
    "Kategorie Freizeit": {
      category: ['Freizeit'],
    },
    "Kategorie Sonstige": {
      category: ['Sonstige'],
    },
  },
  activeByDefault: ["nicht gelöscht"],
};
