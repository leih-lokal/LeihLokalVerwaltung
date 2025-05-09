import { millisAtStartOfToday } from "../../utils/utils";

const MILLIS_PER_DAY = 86400 * 1000;
const START_OF_TODAY = new Date(millisAtStartOfToday()).toLocaleDateString('fr-CA')
const START_OF_TOMORROW = new Date(millisAtStartOfToday() + MILLIS_PER_DAY).toLocaleDateString('fr-CA')

// PocketBase filter syntax

export default {
  filters: {
    'aktuell': [`returned_on = null || (returned_on >= '${START_OF_TODAY}' && returned_on < '${START_OF_TOMORROW}')`],
    'abgeschlossen': [`returned_on > 0`],
    'Rückgabe heute': [`expected_on >= '${START_OF_TODAY}' && expected_on < '${START_OF_TOMORROW}'`],
    'verspätet': [`returned_on = null && expected_on < '${START_OF_TODAY}'`]
  },
  activeByDefault: ['aktuell'],
}
