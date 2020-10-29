export default {
  filters: {
    "Newsletter: Ja": (customer) =>
      ["true", "ja"].includes(String(customer.subscribed_to_newsletter).toLowerCase()),
    "Beitritt vor > 1 Jahr": (customer) =>
      customer.registration_date &&
      new Date() - new Date(customer.registration_date) > 1000 * 60 * 60 * 24 * 365,
    "Beitritt vor < 1 Jahr": (customer) =>
      customer.registration_date &&
      new Date() - new Date(customer.registration_date) < 1000 * 60 * 60 * 24 * 365,
    "Verlängert vor > 1 Jahr": (customer) =>
      customer.renewed_on && new Date() - new Date(customer.renewed_on) > 1000 * 60 * 60 * 24 * 365,
    "Verlängert vor < 1 Jahr": (customer) =>
      customer.renewed_on && new Date() - new Date(customer.renewed_on) < 1000 * 60 * 60 * 24 * 365,
  },
  activeByDefault: [],
};
