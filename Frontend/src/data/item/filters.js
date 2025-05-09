import { ITEM_STATUSES } from "./constants";
import { joinFiltersOr } from '../../utils/api'

// PocketBase filter syntax

export default {
  filters: {
    "nicht gelöscht": joinFiltersOr(ITEM_STATUSES.filter(s => s !== 'deleted').map(s => `status = '${s}'`)),
    "gelöscht": `status = 'deleted'`,
    "verfügbar": `status = 'instock'`,
    "ausgeliehen": `status = 'outofstock'`,
    "reserviert": `status = 'reserved'`,
    "nicht verleihbar": `status = 'onbackorder'`,
    "verschollen": `status = 'lost'`,
    "in Reparatur": `status = 'repairing'`,
    "zu verkaufen": `status = 'forsale'`,
    "Kategorie Küche": `category ~ 'Küche'`,
    "Kategorie Haushalt": `category ~ 'Haushalt'`,
    "Kategorie Garten": `category ~ 'Garten'`,
    "Kategorie Heimwerker": `category ~ 'Heimwerker'`,
    "Kategorie Kinder": `category ~ 'Kinder'`,
    "Kategorie Freizeit": `category ~ 'Freizeit'`,
    "Kategorie Sonstige": `category ~ 'Sonstige'`,
  },
  activeByDefault: ["nicht gelöscht"],
};
