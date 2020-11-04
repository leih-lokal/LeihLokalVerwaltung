export default {
  filters: {
    "Newsletter: Ja": function (customer) {
      var subscribedToNewsletter = String(customer.subscribed_to_newsletter).toLowerCase();
      return subscribedToNewsletter === "true" || subscribedToNewsletter === "ja";
    },
    "Beitritt vor > 1 Jahr": function (customer) {
      return (
        customer.registration_date &&
        new Date() - new Date(customer.registration_date) > 1000 * 60 * 60 * 24 * 365
      );
    },
    "Beitritt vor < 1 Jahr": function (customer) {
      return (
        customer.registration_date &&
        new Date() - new Date(customer.registration_date) < 1000 * 60 * 60 * 24 * 365
      );
    },
    "Verlängert vor > 1 Jahr": function (customer) {
      return (
        customer.renewed_on &&
        new Date() - new Date(customer.renewed_on) > 1000 * 60 * 60 * 24 * 365
      );
    },
    "Verlängert vor < 1 Jahr": function (customer) {
      return (
        customer.renewed_on &&
        new Date() - new Date(customer.renewed_on) < 1000 * 60 * 60 * 24 * 365
      );
    },
  },
  activeByDefault: [],
};
