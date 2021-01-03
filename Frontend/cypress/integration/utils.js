const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
    2,
    0
  )}.${date.getFullYear()}`;

const statusOnWebsiteDisplayValue = (status) =>
  status
    .replace("deleted", "gelöscht")
    .replace("instock", "verfügbar")
    .replace("outofstock", "verliehen")
    .replace("onbackorder", "nicht verleihbar");

const waitForPopupToClose = () => cy.get(".bg", { timeout: 3000 }).should("not.exist");
const clearFilter = () => cy.get(".multiSelectItem_clear").click();

export default { dateToString, statusOnWebsiteDisplayValue, waitForPopupToClose, clearFilter };
