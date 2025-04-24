import Database from "../database/ENV_DATABASE";

const activeRentalsForCustomerSelector = (customerId) =>
  Database.selectorBuilder()
    .withDocType("rental")
    .withField("customer_id")
    .equals(customerId)
    .withField("returned_on")
    .equals(0)
    .build();

export {
  activeRentalsForCustomerSelector,
};
