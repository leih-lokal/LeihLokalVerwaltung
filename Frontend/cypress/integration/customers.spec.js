/// <reference types="cypress" />
import data from "../../spec/Database/DummyData/customers";
import columns from "../../src/components/TableEditors/Customers/Columns";
import { dateToString } from "./utils";

let customers;

const expectedDisplayValue = (customer, customerKey) => {
  let expectedValue = customer[customerKey];
  let colKey = columns.find((col) => col.key === customerKey).key;
  if (["registration_date", "renewed_on"].includes(colKey)) {
    if (expectedValue === 0) {
      expectedValue = "";
    } else {
      const date = new Date(expectedValue);
      expectedValue = dateToString(date);
    }
  } else if (colKey === "subscribed_to_newsletter") {
    expectedValue = ["true", "ja"].includes(String(expectedValue).toLowerCase()) ? "Ja" : "Nein";
  }
  return expectedValue;
};

const expectedDisplayedTableDataSortedBy = (key, customers) => {
  let transformBeforeSort = (value) => value;
  if (key === "_id" || key === "registration_date") transformBeforeSort = parseInt;
  return customers.sort(function (a, b) {
    var x = transformBeforeSort(a[key]);
    var y = transformBeforeSort(b[key]);
    return x < y ? -1 : x > y ? 1 : 0;
  });
};

const expectDisplaysAllCustomersSortedBy = (sortKey, reverse = false) => {
  let expectedDisplayedTableDataSortedById = expectedDisplayedTableDataSortedBy(sortKey, customers);
  if (reverse) expectedDisplayedTableDataSortedById.reverse();
  expectDisplaysCustomers(expectedDisplayedTableDataSortedById);
};

const expectDisplaysOnlyCustomersWithIds = (ids) => {
  const customersWithIds = [];
  ids.forEach((id) => customersWithIds.push(customers.find((customer) => customer._id === id)));
  expectDisplaysCustomers(customersWithIds);
};

const expectDisplaysCustomers = (customers) => {
  cy.get("table > tr").should("have.length", customers.length);
  cy.get("table > tr").each((row, rowIndex) => {
    row.find("td > div").each((colIndex, cell) => {
      if (customers[rowIndex][columns[colIndex].key]) {
        expect(cell).to.contain(expectedDisplayValue(customers[rowIndex], columns[colIndex].key));
      }
    });
  });
};

context("Customers", () => {
  beforeEach(() => {
    customers = JSON.parse(JSON.stringify(data));
    window.indexedDB
      .databases()
      .then((dbs) => dbs.forEach((db) => window.indexedDB.deleteDatabase(db.name)));
    cy.clock(Date.UTC(2020, 0, 1), ["Date"]);
    cy.visit("../../public/index.html").get("nav").contains("Kunden").click();
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

  context("Searching", () => {
    it("finds a customer by search for 'firstname lastname'", () => {
      cy.get(".searchInput").type(customers[5].firstname + " " + customers[5].lastname);
      expectDisplaysOnlyCustomersWithIds([customers[5]._id]);
    });

    it("finds two customers when seaching for first id digit", () => {
      cy.get(".searchInput").type("1");
      expectDisplaysOnlyCustomersWithIds(["1", "10"]);
    });

    it("finds one customer when seaching for unique id", () => {
      cy.get(".searchInput").type("2");
      expectDisplaysOnlyCustomersWithIds(["2"]);
    });
  });

  context("Filtering", () => {
    it("Displays all customers when removing filters", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Newsletter: Ja").click();
      expectDisplaysOnlyCustomersWithIds(["2", "6", "7"]);
      cy.get(".multiSelectItem_clear").click();
      expectDisplaysAllCustomersSortedBy("_id");
    });

    it("finds customers by filtering for 'Newsletter: Ja'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Newsletter: Ja").click();
      expectDisplaysOnlyCustomersWithIds(["2", "6", "7"]);
    });

    it("finds customers by filtering for 'Beitritt vor > 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor > 1 Jahr")
        .click();
      expectDisplaysOnlyCustomersWithIds(["1", "2", "3", "4", "5"]);
    });

    it("finds customers by filtering for 'Beitritt vor < 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor < 1 Jahr")
        .click();
      expectDisplaysOnlyCustomersWithIds(["6", "7", "8", "9", "10"]);
    });
  });

  context("Editing", () => {
    const expectedDateInputValue = (millis) => {
      if (millis === 0) return "-";
      else return dateToString(new Date(millis));
    };

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(customers[3].firstname).click({ force: true });
      cy.get("#firstname").should("have.value", customers[3].firstname);
      cy.get("#lastname").should("have.value", customers[3].lastname);
      cy.get("#email").should("have.value", customers[3].email);
      cy.get("#telephone_number").should("have.value", customers[3].telephone_number);
      if (customers[3].subscribed_to_newsletter) {
        cy.get("#subscribed_to_newsletter").should("have.class", "-checked");
      } else {
        cy.get("#subscribed_to_newsletter").should("not.have.class", "-checked");
      }
      cy.get("#street").should("have.value", customers[3].street);
      cy.get("#house_number").should("have.value", customers[3].house_number);
      cy.get("#postal_code").should("have.value", customers[3].postal_code);
      cy.get("#city").should("have.value", customers[3].city);
      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        expectedDateInputValue(customers[3].registration_date)
      );
      cy.get(".group row:nth-child(3) .datepicker input").should(
        "have.value",
        expectedDateInputValue(customers[3].renewed_on)
      );
      customers[3].heard
        .split(",")
        .forEach((heard) =>
          cy.get(".group row:nth-child(4) .selectContainer").should("contain.text", heard)
        );

      cy.get("#id").should("have.value", customers[3]._id);
      cy.get("#remark").should("have.value", customers[3].remark);
    });

    it("Saves changes", () => {
      cy.get("table").contains(customers[3].firstname).click({ force: true });
      cy.get("#firstname").clear().type("NewFirstname");
      cy.contains("Speichern").click();
      customers[3].firstname = "NewFirstname";
      expectDisplaysAllCustomersSortedBy("_id");
    });

    it("Deletes customer", () => {
      cy.get("table").contains(customers[3].firstname).click({ force: true });
      cy.contains("Löschen").click();
      expectDisplaysOnlyCustomersWithIds(["1", "2", "3", "5", "6", "7", "8", "9", "10"]);
    });

    it("Creates customer", () => {
      const newCustomer = {
        _id: customers.length + 1 + "",
        lastname: "lastname",
        firstname: "firstname",
        registration_date: new Date(2020, 0, 1).getTime(),
        remark: "Bemerkung 123",
        subscribed_to_newsletter: true,
        email: "mail@mail.com",
        street: "street",
        house_number: 123,
        postal_code: "76137",
        city: "Karlsruhe",
        telephone_number: "234534522",
        heard: "",
      };

      cy.contains("+").click();

      cy.get("#id").should("have.value", customers.length + 1);
      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        expectedDateInputValue(new Date(2020, 0, 1).getTime())
      );

      cy.get("#firstname").type(newCustomer.firstname);
      cy.get("#lastname").type(newCustomer.lastname);
      cy.get("#email").type(newCustomer.email);
      cy.get("#telephone_number").type(newCustomer.telephone_number);
      cy.get("#subscribed_to_newsletter").click();
      cy.get("#street").type(newCustomer.street);
      cy.get("body").click();
      cy.get("#house_number").type(newCustomer.house_number);
      cy.get("#postal_code").type(newCustomer.postal_code);
      cy.get("body").click();
      cy.get("#city").type(newCustomer.city);
      cy.get("#remark").type(newCustomer.remark);

      cy.contains("Speichern").click();

      customers.push(newCustomer);
      expectDisplaysCustomers(customers);
    });
  });
});
