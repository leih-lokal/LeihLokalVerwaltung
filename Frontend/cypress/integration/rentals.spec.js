/// <reference types="cypress" />
import data from "../../spec/Database/DummyData/rentals";
import columns from "../../src/components/TableEditors/Rentals/Columns";
import { dateToString, waitForPopupToClose, clearFilter, isAtSameDay } from "./utils";
import COLORS from "../../src/components/Input/ColorDefs";

let rentals;
let currentRentals;

const TODAY = Date.UTC(2020, 0, 1);

const expectedDisplayValue = (rental, column) => {
  let expectedValue = rental[column.key];
  if (["returned_on", "extended_on", "rented_on", "to_return_on"].includes(column.key)) {
    if (expectedValue === 0) {
      expectedValue = "";
    } else {
      const date = new Date(expectedValue);
      expectedValue = dateToString(date);
    }
  }
  return expectedValue ?? "";
};

const expectedDisplayedTableDataSortedBy = (key, rentals) => {
  if (key === "to_return_on") {
    let sorted = rentals.sort(function (a, b) {
      if (a.returned_on && !b.returned_on) return -1;
      if (b.returned_on && !a.returned_on) return 1;
      var x = parseInt(a.to_return_on) + String(a.name).localeCompare(b.name);
      var y = parseInt(b.to_return_on) + String(b.name).localeCompare(a.name);
      return x < y ? -1 : x > y ? 1 : 0;
    });

    return sorted;
  } else {
    let transformBeforeSort = (value) => value;
    if (["returned_on", "extended_on", "rented_on", "item_id", "customer_id"].includes(key))
      transformBeforeSort = parseInt;
    return rentals.sort(function (a, b) {
      var x = transformBeforeSort(a[key]);
      var y = transformBeforeSort(b[key]);
      return x < y ? -1 : x > y ? 1 : 0;
    });
  }
};

const expectDisplaysRentalsSortedBy = (rentals, sortKey = "to_return_on", reverse = false) => {
  let expectedDisplayedTableDataSortedById = expectedDisplayedTableDataSortedBy(sortKey, rentals);
  if (reverse) expectedDisplayedTableDataSortedById.reverse();
  return expectDisplaysRentals(expectedDisplayedTableDataSortedById);
};

const expectDisplaysOnlyRentalsWithIds = (ids) => {
  const rentalsWithIds = ids.map((id) =>
    rentals.find((rental) => parseInt(rental._id) === parseInt(id))
  );
  expectDisplaysRentals(rentalsWithIds);
};

const expectDisplaysRentals = (rentals) =>
  cy
    .get("table > tr")
    .should("be.visible")
    .should("have.length", rentals.length)
    .each((row, i) =>
      cy
        .wrap(row)
        .children("td")
        .each((cell, x) =>
          cy
            .wrap(cell)
            .should(
              "have.css",
              "background-color",
              i % 2 == 0 &&
                rentals[i].expectedCellBackgroundColors[x] === COLORS.DEFAULT_ROW_BACKGROUND_ODD
                ? COLORS.DEFAULT_ROW_BACKGROUND_EVEN
                : rentals[i].expectedCellBackgroundColors[x]
            )
        )
        .each((cell, x) => {
          if (columns[x].isImageUrl && rentals[i][columns[x].key]) {
            return cy
              .wrap(cell)
              .children("img")
              .should("have.attr", "src", rentals[i][columns[x].key]);
          } else {
            return cy
              .wrap(cell)
              .should(
                "have.text",
                rentals[i][columns[x].key] ? expectedDisplayValue(rentals[i], columns[x]) : ""
              );
          }
        })
    );

context("rentals", () => {
  beforeEach(() => {
    cy.clock(TODAY, ["Date"]);
    rentals = data(TODAY);
    currentRentals = rentals.filter(
      (rental) => rental.returned_on === 0 || rental.returned_on > Date.UTC(2019, 11, 31)
    );
    window.indexedDB
      .databases()
      .then((dbs) => dbs.forEach((db) => window.indexedDB.deleteDatabase(db.name)));
    cy.visit("../../public/index.html").get("nav").contains("Leihvorgänge").click();
  });

  it("displays correct number of rentals", () => {
    cy.get("table > tr").should("have.length", currentRentals.length);
  });

  context("Sorting", () => {
    it("sorts by to return on", () => {
      expectDisplaysRentalsSortedBy(currentRentals, "to_return_on");
    });

    it("sorts by to return on reverse", () => {
      cy.get("thead")
        .contains("Zurückerwartet")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "to_return_on", true));
    });

    it("sorts rentals by number", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "item_id"));
    });

    it("sorts rentals by number reverse", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "item_id", true));
    });

    it("sorts rentals by name", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "item_name"));
    });

    it("sorts rentals by name reverse", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "item_name", true));
    });

    it("sorts rentals by rented on", () => {
      cy.get("thead")
        .contains("Ausgegeben")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "rented_on"));
    });

    it("sorts rentals by rented on reverse", () => {
      cy.get("thead")
        .contains("Ausgegeben")
        .click()
        .get("thead")
        .contains("Ausgegeben")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "rented_on", true));
    });

    it("sorts rentals by customer_id", () => {
      cy.get("thead")
        .contains("Kunde Nr")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "customer_id"));
    });

    it("sorts rentals by customer_id reverse", () => {
      cy.get("thead")
        .contains("Kunde Nr")
        .click()
        .get("thead")
        .contains("Kunde Nr")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "customer_id", true));
    });

    it("sorts rentals by customer name", () => {
      cy.get("thead")
        .contains("Kunde Name")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "name"));
    });

    it("sorts rentals by customer name reverse", () => {
      cy.get("thead")
        .contains("Kunde Name")
        .click()
        .get("thead")
        .contains("Kunde Name")
        .click()
        .then(() => expectDisplaysRentalsSortedBy(currentRentals, "name", true));
    });
  });

  context("Searching", () => {
    beforeEach(clearFilter);

    it("finds a rental by search for item_id", () => {
      cy.get(".searchInput")
        .type(rentals[3].item_id, { force: true })
        .then(() => expectDisplaysOnlyRentalsWithIds([rentals[3]._id]));
    });

    it("finds a rental by search for item_name", () => {
      cy.get(".searchInput")
        .type(rentals[4].item_name, { force: true })
        .then(() => expectDisplaysOnlyRentalsWithIds([rentals[4]._id]));
    });

    it("finds a rental by search for customer name", () => {
      cy.get(".searchInput")
        .type(rentals[4].name, { force: true })
        .then(() => expectDisplaysOnlyRentalsWithIds([rentals[4]._id]));
    });
  });

  context("Filtering", () => {
    beforeEach(clearFilter);

    it("displays all rentals when removing filters", () => {
      cy.get("table > tr")
        .should("have.length", rentals.length)
        .then(() => expectDisplaysRentalsSortedBy(rentals));
    });

    it("finds rentals by filtering for 'abgeschlossen'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("abgeschlossen")
        .click()
        .then(() =>
          expectDisplaysRentalsSortedBy(rentals.filter((rental) => rental.returned_on != 0))
        );
    });

    it("finds rentals by filtering for 'Rückgabe heute'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Rückgabe heute")
        .click()
        .then(() =>
          expectDisplaysRentalsSortedBy(
            rentals.filter((rental) => isAtSameDay(parseInt(rental.to_return_on), TODAY))
          )
        );
    });

    it("finds rentals by filtering for 'verspätet'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("verspätet")
        .click()
        .then(() =>
          expectDisplaysRentalsSortedBy(
            rentals.filter(
              (rental) =>
                parseInt(rental.to_return_on) < Date.UTC(2020, 0, 1) && rental.returned_on == 0
            )
          )
        );
    });
  });

  context("Editing", () => {
    beforeEach(clearFilter);

    const expectedDateInputValue = (millis) => {
      if (millis === 0) return "-";
      else return dateToString(new Date(millis));
    };

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.get("#item_id").should("have.value", rentals[4].item_id);
      cy.get("#item_name").should("have.value", rentals[4].item_name);
      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        expectedDateInputValue(rentals[4].rented_on)
      );
      cy.get(".group row:nth-child(3) .datepicker input").should(
        "have.value",
        expectedDateInputValue(rentals[4].extended_on)
      );
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        expectedDateInputValue(rentals[4].to_return_on)
      );
      cy.get(".group row:nth-child(5) .datepicker input").should(
        "have.value",
        expectedDateInputValue(rentals[4].returned_on)
      );

      cy.get("#customer_id").should("have.value", rentals[4].customer_id);
      cy.get("#customer_name").should("have.value", rentals[4].name);
      cy.get("#deposit").should("have.value", rentals[4].deposit);
      cy.get("#deposit_returned").should("have.value", rentals[4].deposit_returned);

      cy.get("#passing_out_employee").should("have.value", rentals[4].passing_out_employee);
      cy.get("#receiving_employee").should("have.value", rentals[4].receiving_employee);
      cy.get("#remark").should("have.value", rentals[4].remark);
    });

    it("Saves changes", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.contains("Speichern").click();
      waitForPopupToClose();
      expectDisplaysRentalsSortedBy(rentals);
    });

    it("Deletes rental", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.contains("Löschen").click();
      waitForPopupToClose();
      expectDisplaysRentalsSortedBy(rentals.filter((rental) => rental._id != rentals[4]._id));
    });

    it("Creates rental", () => {
      const newRental = {
        _id: "000eb2bf4e2402858e0e8174d16ec522",
        item_id: "0001",
        item_name: "Dekupiersäge",
        rented_on: Date.UTC(2020, 0, 1),
        to_return_on: Date.UTC(2020, 0, 8),
        passing_out_employee: "MM",
        customer_id: "5",
        returned_on: 0,
        name: "Viviana",
        deposit: 15,
        image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/3106.jpg",
        expectedCellBackgroundColors: new Array(columns.length).fill(
          COLORS.DEFAULT_ROW_BACKGROUND_ODD
        ),
      };

      cy.contains("+").click();

      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        expectedDateInputValue(newRental.rented_on)
      );
      cy.get(".group row:nth-child(3) .datepicker input").should(
        "have.value",
        expectedDateInputValue(newRental.to_return_on)
      );

      cy.get("#item_id").type(newRental.item_id);
      cy.get(".autocomplete-list-item").contains(newRental.item_id).click();
      cy.get("#item_name").clear().type(newRental.item_name);
      cy.get(".autocomplete-list-item").contains(newRental.item_name).click();
      cy.get("#customer_id").clear().type(newRental.customer_id);
      cy.get(".autocomplete-list-item").contains(newRental.name).click();
      cy.get("#customer_name").clear().type(newRental.name);
      cy.get(".autocomplete-list-item").contains(newRental.name).click();
      cy.get("#deposit").clear().type(newRental.deposit);
      cy.get("#passing_out_employee").type(newRental.passing_out_employee);

      cy.contains("Speichern").click();
      waitForPopupToClose();

      rentals.push(newRental);
      expectDisplaysRentalsSortedBy(rentals);
    });
  });
});
