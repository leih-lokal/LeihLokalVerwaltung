const MILLIS_PER_DAY = 86400 * 1000;
const CURRENT_TIME_MILLIS = new Date().getTime();
const START_OF_TODAY = millisAtStartOfDay(CURRENT_TIME_MILLIS);

function millisAtStartOfDay(millis) {
  return millis - (millis % MILLIS_PER_DAY);
}

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
            $and: [
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
        ],
      },
    },
  },
  activeByDefault: ["aktuell"],
};
