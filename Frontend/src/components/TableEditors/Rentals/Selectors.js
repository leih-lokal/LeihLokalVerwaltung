import Database from "../../Database/ENV_DATABASE";

const customerIdStartsWithSelector = (searchValue) =>
  Database.selectorBuilder()
    .withField("id")
    .numericFieldStartsWith(searchValue)
    .withDocType("customer")
    .build();

const itemIdStartsWithAndNotDeletedSelector = (searchValue) =>
  Database.selectorBuilder()
    .withField("id")
    .numericFieldStartsWith(searchValue)
    .withDocType("item")
    .withField("status")
    .isNotEqualTo("deleted")
    .build();

const customerAttributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
  Database.selectorBuilder()
    .withField(field)
    .startsWithIgnoreCase(searchValue)
    .withDocType("customer")
    .build();

const itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector = (field, searchValue) =>
  Database.selectorBuilder()
    .withField(field)
    .startsWithIgnoreCase(searchValue)
    .withField("status")
    .isNotEqualTo("deleted")
    .withDocType("item")
    .build();

const activeRentalsForCustomerSelector = (customerId) =>
  Database.selectorBuilder()
    .withDocType("rental")
    .withField("customer_id")
    .equals(customerId)
    .withField("returned_on")
    .equals(0)
    .build();

export {
  customerIdStartsWithSelector,
  itemIdStartsWithAndNotDeletedSelector,
  customerAttributeStartsWithIgnoreCaseSelector,
  itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
  activeRentalsForCustomerSelector,
};
