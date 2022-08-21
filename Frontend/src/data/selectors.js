import Database from "../database/ENV_DATABASE";

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
    .startsWithIgnoreCaseAndDiacritics(searchValue)
    .withDocType("customer")
    .build();

const itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector = (
  field,
  searchValue
) =>
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

const customerById = (customerId) =>
  Database.selectorBuilder()
    .withDocType("customer")
    .withField("id")
    .equals(customerId)
    .build();

const customerByLastname = (customerLastname) =>
  Database.selectorBuilder()
    .withDocType("customer")
    .withField("lastname")
    .equals(customerLastname)
    .build();

const itemById = (itemId) =>
  Database.selectorBuilder()
    .withDocType("item")
    .withField("id")
    .equals(itemId)
    .build();

const itemByName = (itemName) =>
  Database.selectorBuilder()
    .withDocType("item")
    .withField("name")
    .equals(itemName)
    .build();

export {
  customerIdStartsWithSelector,
  itemIdStartsWithAndNotDeletedSelector,
  customerAttributeStartsWithIgnoreCaseSelector,
  itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
  activeRentalsForCustomerSelector,
  customerById,
  itemById,
  itemByName,
  customerByLastname,
};
