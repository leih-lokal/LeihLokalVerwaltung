import { millisAtStartOfToday } from "../../utils/utils";

const MILLIS_PER_DAY = 86400 * 1000;
const START_OF_TODAY = millisAtStartOfToday();

export default {
  filters: {
    aktuell: {
      required_fields: ["returned_on"],
      selectors: {
        $or: [
          {
            returned_on: {
              $eq: 0,
            },
          },
          {
            returned_on: {
              $exists: false,
            },
          },
          {
            $and: [
              {
                returned_on: {
                  $gte: START_OF_TODAY,
                },
              },
              {
                returned_on: {
                  $lt: START_OF_TODAY + MILLIS_PER_DAY,
                },
              },
            ],
          },
        ],
      },
    },
    abgeschlossen: {
      required_fields: ["returned_on"],
      selectors: {
        returned_on: {
          $gt: 0,
        },
      },
    },
    "Rückgabe heute": {
      required_fields: ["to_return_on"],
      selectors: {
        $and: [
          {
            to_return_on: {
              $gte: START_OF_TODAY,
            },
          },
          {
            to_return_on: {
              $lt: START_OF_TODAY + MILLIS_PER_DAY,
            },
          },
        ],
      },
    },
    verspätet: {
      required_fields: ["returned_on", "to_return_on"],
      selectors: {
        $and: [
          {
            to_return_on: {
              $gt: 0,
            },
          },
          {
            returned_on: {
              $eq: 0,
            },
          },
          {
            to_return_on: {
              $lt: START_OF_TODAY,
            },
          },
        ],
      },
    },
  },
  activeByDefault: ["aktuell"],
};
