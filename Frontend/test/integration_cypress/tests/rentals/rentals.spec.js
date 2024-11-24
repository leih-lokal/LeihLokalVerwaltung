/// <reference types="cypress" />

const expectedData = {
  sortedByToReturnOnDesc: require("./expectedData/sortedByToReturnOnDesc.js"),
  sortedByToReturnOnAsc: require("./expectedData/sortedByToReturnOnAsc.js"),
  sortedByCustomerIdAsc: require("./expectedData/sortedByCustomerIdAsc.js"),
  sortedByCustomerIdDesc: require("./expectedData/sortedByCustomerIdDesc.js"),
  sortedByCustomerNameAsc: require("./expectedData/sortedByCustomerNameAsc.js"),
  sortedByCustomerNameDesc: require("./expectedData/sortedByCustomerNameDesc.js"),
  sortedByItemIdAsc: require("./expectedData/sortedByItemIdAsc.js"),
  sortedByItemIdDesc: require("./expectedData/sortedByItemIdDesc.js"),
  sortedByItemNameAsc: require("./expectedData/sortedByItemNameAsc.js"),
  sortedByItemNameDesc: require("./expectedData/sortedByItemNameDesc.js"),
  searchForItemId: require("./expectedData/searchForItemId.js"),
  searchForCustomerName: require("./expectedData/searchForCustomerName.js"),
  searchForItemName: require("./expectedData/searchForItemName.js"),
  noFilters: require("./expectedData/noFilters.js"),
  filterForAbgeschlossen: require("./expectedData/filterForAbgeschlossen.js"),
  filterForRueckgabeHeute: require("./expectedData/filterForRueckgabeHeute.js"),
  filterForVerspaetet: require("./expectedData/filterForVerspaetet.js"),
  rentalToEdit: require("./expectedData/rentalToEdit.js"),
  rentalEdited: require("./expectedData/rentalEdited.js"),
  rentalDeleted: require("./expectedData/rentalDeleted.js"),
  createdRental: require("./expectedData/createdRental.js"),
  createdRentalWithDefaultValues: require("./expectedData/createdRentalWithDefaultValues.js"),
};

const {
  resetTestData,
  catchMissingIndexExceptions,
  waitForPopupToClose,
} = require("../../utils.js");

const TODAY = Date.UTC(2021, 2, 28);

catchMissingIndexExceptions();

context("rentals", () => {
  beforeEach(() => {
    cy.clock(TODAY, ["Date"]);
    cy.visit("../../public/index.html#/rentals").then(() =>
      cy.get("tbody > tr", { timeout: 30000 })
    );
  });

  context("Sorting", () => {
    it("sorts by to return on desc", () => {
      cy.expectDisplaysTableData(expectedData.sortedByToReturnOnDesc, expectedData.sortedByToReturnOnDesc.length);
    });

    it("sorts by to return on asc", () => {
      cy.get("thead")
        .contains("Zurückerwartet")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByToReturnOnAsc, expectedData.sortedByToReturnOnAsc.length)
        );
    });

    it("sorts rentals by item id asc", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() => cy.expectDisplaysTableData(expectedData.sortedByItemIdAsc, expectedData.sortedByItemIdAsc.length));
    });

    it("sorts rentals by item id desc", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByItemIdDesc, expectedData.sortedByItemIdDesc.length)
        );
    });

    it("sorts rentals by item name asc", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByItemNameAsc, expectedData.sortedByItemNameAsc.length)
        );
    });

    it("sorts rentals by item name desc", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByItemNameDesc, expectedData.sortedByItemNameDesc.length)
        );
    });

    it("sorts rentals by customer id asc", () => {
      cy.get("thead")
        .contains("Nutzer-Nr.")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByCustomerIdAsc, expectedData.sortedByCustomerIdAsc.length)
        );
    });

    it("sorts rentals by customer id desc", () => {
      cy.get("thead")
        .contains("Nutzer-Nr.")
        .click()
        .get("thead")
        .contains("Nutzer-Nr.")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByCustomerIdDesc, expectedData.sortedByCustomerIdDesc.length)
        );
    });

    it("sorts rentals by customer name asc", () => {
      cy.get("thead")
        .contains("Nutzername")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByCustomerNameAsc, expectedData.sortedByCustomerNameAsc.length)
        );
    });

    it("sorts rentals by customer name desc", () => {
      cy.get("thead")
        .contains("Nutzername")
        .click()
        .get("thead")
        .contains("Nutzername")
        .click()
        .then(() =>
          cy.expectDisplaysTableData(expectedData.sortedByCustomerNameDesc, expectedData.sortedByCustomerNameDesc.length)
        );
    });
  });

  context("Searching", () => {
    it("finds a rental by search for item_id", () => {
      cy.get(".searchInput")
        .type(15)
        .then(() => cy.expectDisplaysTableData(expectedData.searchForItemId, expectedData.searchForItemId.length));
    });

    it("finds a rental by search for item_name", () => {
      cy.get(".searchInput")
        .type("Silikon")
        .then(() => cy.expectDisplaysTableData(expectedData.searchForItemName, expectedData.searchForItemName.length));
    });

    it("finds a rental by search for customer_name", () => {
      cy.get(".searchInput")
        .type("Cruft")
        .then(() =>
          cy.expectDisplaysTableData(expectedData.searchForCustomerName, expectedData.searchForCustomerName.length)
        );
    });
  });

  context("Filtering", () => {
    const clearFilter = () => cy.get(".multiSelectItem_clear").click();
    beforeEach(clearFilter);

    it("displays all rentals when removing filters", () => {
      cy.expectDisplaysTableData(expectedData.noFilters, expectedData.noFilters.length);
    });

    it("finds rentals by filtering for 'abgeschlossen'", () => {
      cy.get(".selectContainer").click();
      cy.contains(".selectContainer .item", "abgeschlossen").click();
      cy.expectDisplaysTableData(expectedData.filterForAbgeschlossen, expectedData.filterForAbgeschlossen.length);
    });

    it("finds rentals by filtering for 'Rückgabe heute'", () => {
      cy.get(".selectContainer").click();
      cy.contains(".selectContainer .item", "Rückgabe heute").click();
      cy.expectDisplaysTableData(expectedData.filterForRueckgabeHeute, expectedData.filterForRueckgabeHeute.length);
    });

    it("finds rentals by filtering for 'verspätet'", () => {
      cy.get(".selectContainer").click();
      cy.contains(".selectContainer .item", "verspätet").click();
      cy.expectDisplaysTableData(expectedData.filterForVerspaetet, expectedData.filterForVerspaetet.length);
    });
  });

  context("Editing", () => {
    afterEach(resetTestData);

    it("Displays correct data in Edit Popup", () => {
      const rentalToEdit = expectedData.rentalToEdit;
      cy.get("table").contains(rentalToEdit.customer_name).click();
      cy.get("#item_id").should("have.value", rentalToEdit.item_id);
      cy.get("#item_name").should("have.value", rentalToEdit.item_name);
      cy.get(":nth-child(2) > .col-input > .datepicker input").should(
        "have.value",
        rentalToEdit.rented_on
      );
      cy.get(":nth-child(3) > .col-input > .datepicker input").should(
        "have.value",
        rentalToEdit.extended_on
      );
      cy.get(":nth-child(4) > .col-input > .datepicker input").should(
        "have.value",
        rentalToEdit.to_return_on
      );
      cy.get(":nth-child(5) > .col-input > .datepicker input").should(
        "have.value",
        rentalToEdit.returned_on
      );

      cy.get("#customer_id").should("have.value", rentalToEdit.customer_id);
      cy.get("#customer_name").should("have.value", rentalToEdit.customer_name);
      cy.get("#deposit").should("have.value", rentalToEdit.deposit);
      cy.get("#deposit_returned").should(
        "have.value",
        rentalToEdit.deposit_returned
      );

      cy.get("#passing_out_employee").should(
        "have.value",
        rentalToEdit.passing_out_employee
      );
      cy.get("#receiving_employee").should(
        "have.value",
        rentalToEdit.receiving_employee
      );
      cy.get("#remark").should("have.value", rentalToEdit.remark);
    });

    it("Saves changes", () => {
      cy.get("table")
        .contains(expectedData.rentalToEdit.customer_name)
        .click()
        .get("#deposit")
        .clear()
        .type(3);
      cy.get(".footer").contains("Speichern").click();
      cy.expectDisplaysTableData(expectedData.rentalEdited, expectedData.rentalEdited.length);
    });

    it("Deletes rental", () => {
      cy.get("table").contains(expectedData.rentalToEdit.customer_name).click();
      cy.contains("Löschen")
        .click()
        .then(() => {
          cy.expectDisplaysTableData(expectedData.rentalDeleted, expectedData.rentalDeleted.length);
        });
    });

    it("Creates rental", () => {
      cy.exec(
        'curl -H \'Content-Type: application/json\' -X POST http://user:password@127.0.0.1:5984/leihlokal_test/_find -d \'{"selector": {"$and": [{"id":{"$eq": 122}}, {"type":{"$eq": "item"}}]}}\''
      )
        .its("stdout")
        .should("contain", '"status":"instock"');

      const newRental = {
        item_id: 122,
        item_name: "Digital-Multimeter",
        rented_on: "28.03.2021",
        to_return_on: "04.04.2021",
        passing_out_employee: "MM",
        customer_id: 5,
        returned_on: 0,
        customer_name: "Ogelsby",
        deposit: 15,
        deposit_returned: 0,
      };

      cy.contains("+").click();

      cy.get(":nth-child(2) > .col-input > .datepicker input").should(
        "have.value",
        newRental.rented_on
      );
      cy.get(":nth-child(3) > .col-input > .datepicker input").should(
        "have.value",
        newRental.to_return_on
      );

      cy.get("#item_id").type(newRental.item_id).wait(550);
      cy.get(".autocomplete-list-item").contains(newRental.item_id).click();
      cy.get("#item_name").clear().type(newRental.item_name).wait(550);
      cy.get(".autocomplete-list-item").contains(newRental.item_name).click();
      cy.get("#customer_id").clear().type(newRental.customer_id).wait(550);
      cy.get(".autocomplete-list-item")
        .contains(newRental.customer_name)
        .click();
      cy.get("#customer_name").clear().type(newRental.customer_name).wait(550);
      cy.get(".autocomplete-list-item")
        .contains(newRental.customer_name)
        .click();
      cy.get("#deposit").clear().type(newRental.deposit);
      cy.get("#passing_out_employee").type(newRental.passing_out_employee);

      cy.get(".footer").contains("Speichern").click()

      cy.wait(1000);
      waitForPopupToClose();

      cy.get("thead").contains("Ausgegeben").click().click();
      cy.contains("Leihvorgang gespeichert").then(() =>
        cy.expectDisplaysTableData(expectedData.createdRental, expectedData.createdRental.length)
      );

      cy.exec(
        'curl -H \'Content-Type: application/json\' -X POST http://user:password@127.0.0.1:5984/leihlokal_test/_find -d \'{"selector": {"$and": [{"id":{"$eq": 122}}, {"type":{"$eq": "item"}}]}}\''
      )
        .its("stdout")
        .should("contain", '"status":"outofstock"');
    });

    // TODO: fix this test case to check that rental cannot be saved because required values missing (see change at 50870f56234b9223ab85b3671f000b322f709276)
    it.skip("Creates rental with default values", () => {
      cy.contains("+").click();
      cy.get(".footer").contains("Speichern").click().click();

      cy.wait(1000);
      waitForPopupToClose();

      cy.get("thead").contains("Ausgegeben").click().click();
      cy.contains("Leihvorgang gespeichert").then(() =>
        cy.expectDisplaysTableData(expectedData.createdRentalWithDefaultValues, expectedData.createdRentalWithDefaultValues.length)
      );
    });

    it("Marks item instock when returned", () => {
      cy.exec(
        'curl -H \'Content-Type: application/json\' -X POST http://user:password@127.0.0.1:5984/leihlokal_test/_find -d \'{"selector": {"$and": [{"id":{"$eq": 5004}}, {"type":{"$eq": "item"}}]}}\''
      )
        .its("stdout")
        .should("contain", '"status":"outofstock"');

      cy.get("table")
        .contains("Hammer")
        .click()
        .get(":nth-child(5) > .col-input > .button-tight")
        .click();
      cy.get(".footer").contains("Speichern").click();

      waitForPopupToClose();

      cy.exec(
        'curl -H \'Content-Type: application/json\' -X POST http://user:password@127.0.0.1:5984/leihlokal_test/_find -d \'{"selector": {"$and": [{"id":{"$eq": 5004}}, {"type":{"$eq": "item"}}]}}\''
      )
        .its("stdout")
        .should("contain", '"status":"instock"');
    });
  });
});
