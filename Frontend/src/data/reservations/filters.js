import { millisAtStartOfToday } from "../../utils/utils";

const MILLIS_PER_DAY = 86400 * 1000;
const START_OF_TODAY = new Date(millisAtStartOfToday()).toLocaleDateString('fr-CA')
const START_OF_TOMORROW = new Date(millisAtStartOfToday() + MILLIS_PER_DAY).toLocaleDateString('fr-CA')

// PocketBase filter syntax

export default {
  filters: {
    'heute': `pickup >= '${START_OF_TODAY}' && pickup < '${START_OF_TOMORROW}'`,
    'offen': `done = false`,
    'erledigt': `done = true`
  },
  activeByDefault: ['heute', 'offen'],
};
