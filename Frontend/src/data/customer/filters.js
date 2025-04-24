const ONE_YEAR_AGO_MILLIS = new Date().getTime() - 1000 * 60 * 60 * 24 * 365;

export default {
  filters: {
    "Newsletter: Ja": {
      newsletter: true,
    },
    "Newsletter: Nein": {
      newsletter: false,
    },
    "Beitritt vor > 1 Jahr": {
      registered_before: ONE_YEAR_AGO_MILLIS,
    },
    "Beitritt vor < 1 Jahr": {
      registered_after: ONE_YEAR_AGO_MILLIS,
    },
    "Verlängert vor > 1 Jahr": {
      renewed_before: ONE_YEAR_AGO_MILLIS,
    },
    "Verlängert vor < 1 Jahr": {
      renewed_after: ONE_YEAR_AGO_MILLIS,
    },
  },
  activeByDefault: [],
};
