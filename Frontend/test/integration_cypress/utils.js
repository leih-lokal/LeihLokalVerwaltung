const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(
    date.getMonth() + 1
  ).padStart(2, 0)}.${date.getFullYear()}`;

const waitForPopupToClose = () =>
  cy.get(".fullscreenoverlay", { timeout: 3000 }).should("not.exist");
const clearFilter = () => cy.get(".multiSelectItem_clear").click();

const resetTestData = () =>
  cy.exec("docker-compose up testdata_generator", {
    timeout: 120000,
  });

const catchMissingIndexExceptions = () => {
  Cypress.on("uncaught:exception", (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test when application throws error
    // because of no usable index after db reset
    if (
      err.message.includes("No index exists") ||
      err.message.includes("Failed to fetch")
    ) {
      return false;
    }
    // we still want to ensure there are no other unexpected
    // errors, so we let them fail the test
    return true;
  });
};

export {
  resetTestData,
  dateToString,
  waitForPopupToClose,
  clearFilter,
  catchMissingIndexExceptions,
};
