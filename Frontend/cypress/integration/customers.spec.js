/// <reference types="cypress" />
import customers from "../../spec/Database/DummyData/customers";
import columns from "../../src/components/TableEditors/Customers/Columns";

const expectedDisplayValue = (customer, customerKey) => {
  let expectedValue = customer[customerKey];
  let colKey = columns.find((col) => col.key === customerKey).key;
  if (["registration_date", "renewed_on"].includes(colKey)) {
    if (expectedValue === 0) {
      expectedValue = "";
    } else {
      const date = new Date(expectedValue);
      expectedValue = `${String(date.getDate()).padStart(2, 0)}.${String(
        date.getMonth() + 1
      ).padStart(2, 0)}.${date.getFullYear()}`;
    }
  } else if (colKey === "subscribed_to_newsletter") {
    expectedValue = ["true", "ja"].includes(String(expectedValue).toLowerCase()) ? "Ja" : "Nein";
  }
  return expectedValue;
};

const expectedDisplayedTableDataSortedBy = (key) => {
  let transformBeforeSort = (value) => value;
  if (key === "_id" || key === "registration_date") transformBeforeSort = parseInt;
  return customers.sort(function (a, b) {
    var x = transformBeforeSort(a[key]);
    var y = transformBeforeSort(b[key]);
    return x < y ? -1 : x > y ? 1 : 0;
  });
};

const expectDisplaysAllCustomersSortedBy = (sortKey, reverse = false) => {
  let expectedDisplayedTableDataSortedById = expectedDisplayedTableDataSortedBy(sortKey, reverse);
  if (reverse) expectedDisplayedTableDataSortedById.reverse();
  cy.get("table > tr").each((row, rowIndex) => {
    row.find("td > div").each((colIndex, cell) => {
      expect(cell).to.contain(
        expectedDisplayValue(expectedDisplayedTableDataSortedById[rowIndex], columns[colIndex].key)
      );
    });
  });
};

context("Customers", () => {
  beforeEach(() => {
    cy.visit("../../public/index.html");
  });

  it("displays correct number of customers", () => {
    cy.get("table > tr").should("have.length", customers.length);
  });

  context("Sorting", () => {
    it("sorts customers by id", () => {
      expectDisplaysAllCustomersSortedBy("_id");
    });

    it("sorts customers by id reverse", () => {
      cy.get("thead").contains("Id").click();
      expectDisplaysAllCustomersSortedBy("_id", true);
    });

    it("sorts customers by lastname", () => {
      cy.get("thead").contains("Nachname").click();
      expectDisplaysAllCustomersSortedBy("lastname");
    });

    it("sorts customers by lastname reverse", () => {
      cy.get("thead").contains("Nachname").click();
      cy.get("thead").contains("Nachname").click();
      expectDisplaysAllCustomersSortedBy("lastname", true);
    });

    it("sorts customers by firstname", () => {
      cy.get("thead").contains("Vorname").click();
      expectDisplaysAllCustomersSortedBy("firstname");
    });

    it("sorts customers by firstname reverse", () => {
      cy.get("thead").contains("Vorname").click();
      cy.get("thead").contains("Vorname").click();
      expectDisplaysAllCustomersSortedBy("firstname", true);
    });

    it("sorts customers by street", () => {
      cy.get("thead").contains("Strasse").click();
      expectDisplaysAllCustomersSortedBy("street");
    });

    it("sorts customers by street reverse", () => {
      cy.get("thead").contains("Strasse").click();
      cy.get("thead").contains("Strasse").click();
      expectDisplaysAllCustomersSortedBy("street", true);
    });

    it("sorts customers by registration date", () => {
      cy.get("thead").contains("Beitritt").click();
      expectDisplaysAllCustomersSortedBy("registration_date");
    });

    it("sorts customers by registration date reverse", () => {
      cy.get("thead").contains("Beitritt").click();
      cy.get("thead").contains("Beitritt").click();
      expectDisplaysAllCustomersSortedBy("registration_date", true);
    });
  });
});
