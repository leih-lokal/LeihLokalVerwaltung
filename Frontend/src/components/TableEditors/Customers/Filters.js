const ONE_YEAR_AGO_MILLIS = new Date().getUTCMilliseconds() - 1000 * 60 * 60 * 24 * 365;

export default {
  filters: {
    "Newsletter: Ja": {
      required_fields: ["subscribed_to_newsletter"],
      selectors: {
        subscribed_to_newsletter: {
          $eq: true,
        },
      },
    },
    "Newsletter: Nein": {
      required_fields: ["subscribed_to_newsletter"],
      selectors: {
        subscribed_to_newsletter: {
          $eq: false,
        },
      },
    },
    "Beitritt vor > 1 Jahr": {
      required_fields: ["registration_date"],
      selectors: {
        registration_date: {
          $lt: ONE_YEAR_AGO_MILLIS,
        },
      },
    },
    "Beitritt vor < 1 Jahr": {
      required_fields: ["registration_date"],
      selectors: {
        registration_date: {
          $gt: ONE_YEAR_AGO_MILLIS,
        },
      },
    },
    "Verlängert vor > 1 Jahr": {
      required_fields: ["renewed_on"],
      selectors: {
        renewed_on: {
          $lt: ONE_YEAR_AGO_MILLIS,
        },
      },
    },
    "Verlängert vor < 1 Jahr": {
      required_fields: ["renewed_on"],
      selectors: {
        renewed_on: {
          $gt: ONE_YEAR_AGO_MILLIS,
        },
      },
    },
  },
  activeByDefault: [],
};
