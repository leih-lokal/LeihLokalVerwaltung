import { saveParseStringToBoolean } from "../../../utils/utils.js";

const YEAR_IN_MILLIS = 1000 * 60 * 60 * 24 * 365;

const millisSince = (date) => {
  return new Date() - new Date(date);
};

export default {
  filters: {
    "Newsletter: Ja": (customer) => saveParseStringToBoolean(customer.subscribed_to_newsletter),
    "Beitritt vor > 1 Jahr": (customer) =>
      customer.registration_date && millisSince(customer.registration_date) > YEAR_IN_MILLIS,
    "Beitritt vor < 1 Jahr": (customer) =>
      customer.registration_date && millisSince(customer.registration_date) < YEAR_IN_MILLIS,
    "Verlängert vor > 1 Jahr": (customer) =>
      customer.renewed_on && millisSince(customer.renewed_on) > YEAR_IN_MILLIS,
    "Verlängert vor < 1 Jahr": (customer) =>
      customer.renewed_on && millisSince(customer.renewed_on) < YEAR_IN_MILLIS,
  },
  activeByDefault: [],
};
