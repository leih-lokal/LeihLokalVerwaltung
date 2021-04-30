/// <reference types="cypress" />
import testdata from "./testdata";
import ColorDefs from "../../src/components/Input/ColorDefs";
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
  if (key === "id" || key === "registration_date") transformBeforeSort = parseInt;
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
  ids.forEach((id) => customersWithIds.push(customers.find((customer) => customer.id === id)));
  expectDisplaysCustomers(customersWithIds);
};

const expectedBackgroundColorForRow = (customers, rowIndex) => {
  if (customers[rowIndex].hasOwnProperty("highlight")) {
    return customers[rowIndex]["highlight"];
  } else {
    return rowIndex % 2 === 0
      ? ColorDefs.DEFAULT_ROW_BACKGROUND_EVEN
      : ColorDefs.DEFAULT_ROW_BACKGROUND_ODD;
  }
};

const expectDisplaysCustomers = (customers) =>
  cy
    .get("table > tr", { timeout: 10000 })
    .should("have.length", customers.length)
    .each((row, rowIndex) =>
      cy
        .wrap(row)
        .children("td")
        .each((cell, colIndex) =>
          cy
            .wrap(cell)
            .should(
              "have.text",
              customers[rowIndex].hasOwnProperty([columns[colIndex].key])
                ? expectedDisplayValue(customers[rowIndex], columns[colIndex].key)
                : ""
            )
            .should(
              "have.css",
              "background-color",
              expectedBackgroundColorForRow(customers, rowIndex)
            )
        )
    );

context("Customers", () => {
  beforeEach(() => {
    customers = testdata().filter((doc) => doc.type === "customer");
    cy.clock(Date.UTC(2020, 0, 1), ["Date"]).visit("../../public/index.html#/customers");
  });

  it("displays correct number of customers", () => {
    cy.get("table > tr").should("have.length", customers.length);
  });

  context("Sorting", () => {
    it("sorts customers by id", () => {
      expectDisplaysAllCustomersSortedBy("id");
    });

    it("sorts customers by id reverse", () => {
      cy.get("thead")
        .contains("Id")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("id", true));
    });

    it("sorts customers by lastname", () => {
      cy.get("thead")
        .contains("Nachname")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("lastname"));
    });

    it("sorts customers by lastname reverse", () => {
      cy.get("thead")
        .contains("Nachname")
        .click()
        .get("thead")
        .contains("Nachname")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("lastname", true));
    });

    it("sorts customers by firstname", () => {
      cy.get("thead")
        .contains("Vorname")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("firstname"));
    });

    it("sorts customers by firstname reverse", () => {
      cy.get("thead")
        .contains("Vorname")
        .click()
        .get("thead")
        .contains("Vorname")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("firstname", true));
    });

    it("sorts customers by street", () => {
      cy.get("thead")
        .contains("Straße")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("street"));
    });

    it("sorts customers by street reverse", () => {
      cy.get("thead")
        .contains("Straße")
        .click()
        .get("thead")
        .contains("Straße")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("street", true));
    });

    it("sorts customers by registration date", () => {
      cy.get("thead")
        .contains("Beitritt")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("registration_date"));
    });

    it("sorts customers by registration date reverse", () => {
      cy.get("thead")
        .contains("Beitritt")
        .click()
        .get("thead")
        .contains("Beitritt")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("registration_date", true));
    });
  });

  context("Searching", () => {
    it("finds a customer by search for 'firstname lastname'", () => {
      cy.get(".searchInput")
        .type(customers[5].firstname + " " + customers[5].lastname)
        .then(() => expectDisplaysOnlyCustomersWithIds([customers[5].id]));
    });

    it("finds two customers when seaching for first id digit", () => {
      cy.get(".searchInput")
        .type("1")
        .then(() => expectDisplaysOnlyCustomersWithIds([1, 10]));
    });

    it("finds one customer when seaching for unique id", () => {
      cy.get(".searchInput")
        .type("2")
        .then(() => expectDisplaysOnlyCustomersWithIds([2]));
    });
  });

  context("Filtering", () => {
    it("Displays all customers when removing filters", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Newsletter: Ja")
        .click()
        .then(() => expectDisplaysOnlyCustomersWithIds([2, 6, 7]))
        .get(".multiSelectItem_clear")
        .click()
        .then(() => expectDisplaysAllCustomersSortedBy("id"));
    });

    it("finds customers by filtering for 'Newsletter: Ja'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Newsletter: Ja")
        .click()
        .then(() => expectDisplaysOnlyCustomersWithIds([2, 6, 7]));
    });

    it("finds customers by filtering for 'Beitritt vor > 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor > 1 Jahr")
        .click()
        .then(() => expectDisplaysOnlyCustomersWithIds([1, 2, 3, 4, 5]));
    });

    it("finds customers by filtering for 'Beitritt vor < 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor < 1 Jahr")
        .click()
        .then(() => expectDisplaysOnlyCustomersWithIds([6, 7, 8, 9, 10]));
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

      cy.get("#id").should("have.value", customers[3].id);
      cy.get("#remark").should("have.value", customers[3].remark);
    });

    it("Saves changes", () => {
      cy.get("table").contains(customers[3].firstname).click({ force: true });
      cy.get("#firstname").clear().type("NewFirstname");
      cy.contains("Speichern").click();
      customers[3].firstname = "NewFirstname";
      expectDisplaysAllCustomersSortedBy("id");
    });

    it("Deletes customer", () => {
      cy.get("table").contains(customers[3].firstname).click({ force: true });
      cy.contains("Löschen").click();
      expectDisplaysOnlyCustomersWithIds([1, 2, 3, 5, 6, 7, 8, 9, 10]);
    });

    it("Creates customer", () => {
      const newCustomer = {
        id: customers.length + 1 + "",
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
