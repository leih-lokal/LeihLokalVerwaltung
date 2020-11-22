/// <reference types="cypress" />
import data from "../../spec/Database/DummyData/rentals";
import columns from "../../src/components/TableEditors/Rentals/Columns";
import { dateToString } from "./utils";

let rentals;
let currentRentals;

function millisAtStartOfDay(millis) {
  var msPerDay = 86400 * 1000;
  return millis - (millis % msPerDay);
}

function isBeforeDay(m1, m2) {
  return millisAtStartOfDay(m1) < millisAtStartOfDay(m2);
}

function isToday(millis) {
  return millisAtStartOfDay(millis) === Date.UTC(2020, 0, 1);
}

function isBeforeToday(millis) {
  return isBeforeDay(millis, Date.UTC(2020, 0, 1));
}

const expectedDisplayValue = (rental, rentalKey) => {
  let expectedValue = rental[rentalKey];
  let colKey = columns.find((col) => col.key === rentalKey).key;
  if (["returned_on", "extended_on", "rented_on", "to_return_on"].includes(colKey)) {
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
    return rentals.sort(function (a, b) {
      if (a.returned_on && !b.returned_on) return -1;
      if (b.returned_on && !a.returned_on) return 1;
      var x = parseInt(a[key]);
      var y = parseInt(b[key]);
      return x < y ? -1 : x > y ? 1 : 0;
    });
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
  expectDisplaysRentals(expectedDisplayedTableDataSortedById);
};

const expectDisplaysOnlyRentalsWithIds = (ids) => {
  const rentalsWithIds = ids.map((id) =>
    rentals.find((rental) => parseInt(rental._id) === parseInt(id))
  );
  expectDisplaysRentals(rentalsWithIds);
};

const expectDisplaysRentals = (rentals) => {
  cy.get("table > tr").should("have.length", rentals.length);
  cy.get("table > tr").each((row, rowIndex) => {
    if (isToday(parseInt(rentals[rowIndex].returned_on))) {
      expect(row).to.have.css("background-color", "rgb(214, 252, 208)"); // green
    } else if (
      isToday(parseInt(rentals[rowIndex].to_return_on)) &&
      rentals[rowIndex].returned_on == 0
    ) {
      expect(row).to.have.css("background-color", "rgb(160, 200, 250)"); // blue
    } else if (
      rentals[rowIndex].returned_on === 0 &&
      isBeforeToday(rentals[rowIndex].to_return_on)
    ) {
      expect(row).to.have.css("background-color", "rgb(240, 200, 200)"); // red
    }
    row.find("td").each((colIndex, cell) => {
      expect(cell.innerHTML).to.contain(
        expectedDisplayValue(rentals[rowIndex], columns[colIndex].key)
      );
    });
  });
};

context("rentals", () => {
  beforeEach(() => {
    cy.clock(Date.UTC(2020, 0, 1), ["Date"]);
    rentals = data(Date.UTC(2020, 0, 1));
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
      cy.get("thead").contains("Zurückerwartet").click();
      expectDisplaysRentalsSortedBy(currentRentals, "to_return_on", true);
    });

    it("sorts rentals by number", () => {
      cy.get("thead").contains("Gegenstand Nr").click();
      expectDisplaysRentalsSortedBy(currentRentals, "item_id");
    });

    it("sorts rentals by number reverse", () => {
      cy.get("thead").contains("Gegenstand Nr").click();
      cy.get("thead").contains("Gegenstand Nr").click();
      expectDisplaysRentalsSortedBy(currentRentals, "item_id", true);
    });

    it("sorts rentals by name", () => {
      cy.get("thead").contains("Gegenstand Name").click();
      expectDisplaysRentalsSortedBy(currentRentals, "item_name");
    });

    it("sorts rentals by name reverse", () => {
      cy.get("thead").contains("Gegenstand Name").click();
      cy.get("thead").contains("Gegenstand Name").click();
      expectDisplaysRentalsSortedBy(currentRentals, "item_name", true);
    });

    it("sorts rentals by rented on", () => {
      cy.get("thead").contains("Ausgegeben").click();
      expectDisplaysRentalsSortedBy(currentRentals, "rented_on");
    });

    it("sorts rentals by rented on reverse", () => {
      cy.get("thead").contains("Ausgegeben").click();
      cy.get("thead").contains("Ausgegeben").click();
      expectDisplaysRentalsSortedBy(currentRentals, "rented_on", true);
    });

    it("sorts rentals by customer_id", () => {
      cy.get("thead").contains("Kunde Nr").click();
      expectDisplaysRentalsSortedBy(currentRentals, "customer_id");
    });

    it("sorts rentals by customer_id reverse", () => {
      cy.get("thead").contains("Kunde Nr").click();
      cy.get("thead").contains("Kunde Nr").click();
      expectDisplaysRentalsSortedBy(currentRentals, "customer_id", true);
    });

    it("sorts rentals by customer name", () => {
      cy.get("thead").contains("Kunde Name").click();
      expectDisplaysRentalsSortedBy(currentRentals, "name");
    });

    it("sorts rentals by customer name reverse", () => {
      cy.get("thead").contains("Kunde Name").click();
      cy.get("thead").contains("Kunde Name").click();
      expectDisplaysRentalsSortedBy(currentRentals, "name", true);
    });
  });

  context("Searching", () => {
    beforeEach(() => {
      cy.get(".multiSelectItem_clear").click();
    });

    it("finds a rental by search for item_id", () => {
      cy.get(".searchInput").type(rentals[3].item_id);
      expectDisplaysOnlyRentalsWithIds([rentals[3]._id]);
    });

    it("finds a rental by search for item_name", () => {
      cy.get(".searchInput").type(rentals[4].item_name);
      expectDisplaysOnlyRentalsWithIds([rentals[4]._id]);
    });

    it("finds a rental by search for customer name", () => {
      cy.get(".searchInput").type(rentals[4].name);
      expectDisplaysOnlyRentalsWithIds([rentals[4]._id]);
    });
  });

  context("Filtering", () => {
    beforeEach(() => {
      cy.get(".multiSelectItem_clear").click();
    });

    it("displays all rentals when removing filters", () => {
      cy.get("table > tr").should("have.length", rentals.length);
      expectDisplaysRentalsSortedBy(rentals);
    });

    it("finds rentals by filtering for 'abgeschlossen'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("abgeschlossen").click();
      expectDisplaysRentalsSortedBy(rentals.filter((rental) => rental.returned_on != 0));
    });

    it("finds rentals by filtering for 'Rückgabe heute'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Rückgabe heute").click();
      expectDisplaysRentalsSortedBy(
        rentals.filter((rental) => isToday(parseInt(rental.to_return_on)))
      );
    });

    it("finds rentals by filtering for 'verspätet'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("verspätet").click();
      expectDisplaysRentalsSortedBy(
        rentals.filter(
          (rental) =>
            parseInt(rental.to_return_on) < Date.UTC(2020, 0, 1) && rental.returned_on == 0
        )
      );
    });
  });

  context("Editing", () => {
    beforeEach(() => {
      cy.get(".multiSelectItem_clear").click();
    });

    const expectedDateInputValue = (millis) => {
      if (millis === 0) return "-";
      else return dateToString(new Date(millis));
    };

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.get(":nth-child(1) > .group > :nth-child(2) > .col-input > .hide-arrow > .input").should(
        "have.value",
        rentals[4].item_id
      );
      cy.get("#input_item_name").should("have.value", rentals[4].item_name);
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

      cy.get("#input_customer_id").should("have.value", rentals[4].customer_id);
      cy.get("#input_lastname").should("have.value", rentals[4].name);
      cy.get("#deposit").should("have.value", rentals[4].deposit);
      cy.get("#deposit_returned").should("have.value", rentals[4].deposit_returned);
      cy.get("#deposit_retained").should("have.value", rentals[4].deposit_retained);
      cy.get("#deposit_retainment_reason").should(
        "have.value",
        rentals[4].deposit_retainment_reason
      );

      cy.get("#passing_out_employee").should("have.value", rentals[4].passing_out_employee);
      cy.get("#receiving_employee").should("have.value", rentals[4].receiving_employee);
      cy.get("#remark").should("have.value", rentals[4].remark);
    });

    it("Saves changes", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.get("#deposit_retainment_reason").clear().type("reason");
      cy.get(".button-save").click();
      rentals[4].deposit_retainment_reason = "reason";
      expectDisplaysRentalsSortedBy(rentals);
    });

    it("Deletes rental", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.contains("Leihvorgang Löschen").click();
      expectDisplaysRentalsSortedBy(rentals.filter((rental) => rental._id != rentals[4]._id));
    });

    it("Creates rental", () => {
      const newRental = {
        _id: "000eb2bf4e2402858e0e8174d16ec522",
        item_id: "0001",
        item_name: "Mini-Handkreissäge",
        rented_on: Date.UTC(2020, 0, 1),
        extended_on: 0,
        to_return_on: Date.UTC(2020, 0, 8),
        passing_out_employee: "MM",
        customer_id: "5",
        name: "Viviana",
        deposit: 15,
        deposit_returned: 0,
        deposit_retained: 0,
        returned_on: 0,
        receiving_employee: "",
        deposit_retainment_reason: "",
        remark: "remark",
        image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/3106.jpg",
      };

      cy.contains("+").click();

      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        expectedDateInputValue(newRental.rented_on)
      );
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        expectedDateInputValue(newRental.to_return_on)
      );

      cy.get(":nth-child(1) > .group > :nth-child(2) > .col-input > .hide-arrow > .input").type(
        newRental.item_id
      );
      cy.get("#input_item_name").type(newRental.item_name, { force: true });
      cy.get("#input_customer_id").type(newRental.customer_id);
      cy.get("#input_lastname").type(newRental.name, { force: true });
      cy.get("#deposit").type(newRental.deposit);
      cy.get("#deposit_returned").type(newRental.deposit_returned);
      cy.get("#deposit_retained").type(newRental.deposit_retained);
      cy.get("#passing_out_employee").type(newRental.passing_out_employee);
      cy.get("#remark").type(newRental.remark);

      cy.contains("Speichern").click();

      rentals.push(newRental);
      console.log(rentals);
      expectDisplaysRentalsSortedBy(rentals);
    });
  });
});
