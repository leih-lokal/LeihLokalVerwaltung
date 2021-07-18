/// <reference types="cypress" />

const expectedData = {
  sortedByIdAsc: require("./expectedData/sortedByIdAsc.js"),
  sortedByIdDesc: require("./expectedData/sortedByIdDesc.js"),
  sortedByLastnameAsc: require("./expectedData/sortedByLastnameAsc.js"),
  sortedByLastnameDesc: require("./expectedData/sortedByLastnameDesc.js"),
  sortedByRegistrationDateAsc: require("./expectedData/sortedByRegistrationDateAsc.js"),
  sortedByRegistrationDateDesc: require("./expectedData/sortedByRegistrationDateDesc.js"),
  sortedByStreetAsc: require("./expectedData/sortedByStreetAsc.js"),
  sortedByStreetDesc: require("./expectedData/sortedByStreetDesc.js"),
  searchFirstnameLastname: require("./expectedData/searchFirstnameLastname.js"),
  searchSingleDigit: require("./expectedData/searchSingleDigit.js"),
  searchId: require("./expectedData/searchId.js"),
  filterNewsletterYes: require("./expectedData/filterNewsletterYes.js"),
  filterRegistrationOlderThan1Year: require("./expectedData/filterRegistrationOlderThan1Year.js"),
  filterRegistrationNewerThan1Year: require("./expectedData/filterRegistrationNewerThan1Year.js"),
  customerToEdit: require("./expectedData/customerToEdit.js"),
  createdCustomer: require("./expectedData/createdCustomer.js"),
};

const {
  resetTestData,
  waitForLoadingOverlayToDisappear,
} = require("../../utils.js");

// wait until active rentals (colId 15) is loaded for last customer
const waitForLazyLoadingToComplete = () =>
  cy.get("tbody > tr").each((row) =>
    cy.wrap(row).contains("td:nth-child(15)", /.+/, {
      timeout: 10000,
    })
  );

const expectDisplaysTableWithData = (expectedDataToBeDisplayed) => {
  cy.expectDisplaysTableData(expectedDataToBeDisplayed);
};

const expectDisplaysRow = (expectedRowToBeDisplayed) => {
  cy.expectDisplaysRow(expectedRowToBeDisplayed);
};

const expectNotDisplaysRow = (expectedRowNotToBeDisplayed) => {
  cy.expectNotDisplaysRow(expectedRowNotToBeDisplayed);
};

context("Customers", () => {
  beforeEach(() => {
    cy.clock(Date.UTC(2020, 5, 1), ["Date"])
      .visit("../../public/index.html#/customers")
      .then(waitForLazyLoadingToComplete);
  });

  context("Sorting", () => {
    it("sorts customers by id asc", () => {
      expectDisplaysTableWithData(expectedData.sortedByIdAsc);
    });

    it("sorts customers by id desc", () => {
      cy.get("thead")
        .contains("Id")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdDesc));
    });

    it("sorts customers by lastname asc", () => {
      cy.get("thead")
        .contains("Nachname")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByLastnameAsc)
        );
    });

    it("sorts customers by lastname desc", () => {
      cy.get("thead")
        .contains("Nachname")
        .click()
        .get("thead")
        .contains("Nachname")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByLastnameDesc)
        );
    });

    it("sorts customers by street asc", () => {
      cy.get("thead")
        .contains("Straße")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByStreetAsc)
        );
    });

    it("sorts customers by street desc", () => {
      cy.get("thead")
        .contains("Straße")
        .click()
        .get("thead")
        .contains("Straße")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByStreetDesc)
        );
    });

    it("sorts customers by registration date asc", () => {
      cy.get("thead")
        .contains("Beitritt")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByRegistrationDateAsc)
        );
    });

    it("sorts customers by registration date desc", () => {
      cy.get("thead")
        .contains("Beitritt")
        .click()
        .get("thead")
        .contains("Beitritt")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.sortedByRegistrationDateDesc)
        );
    });
  });

  context("Searching", () => {
    it("finds a customer by search for 'firstname lastname'", () => {
      cy.get(".searchInput")
        .type("Bursnell Nikaniki")
        .wait(1000) // wait for debounce
        .then(() =>
          expectDisplaysTableWithData(expectedData.searchFirstnameLastname)
        );
    });

    it("finds two customers when seaching for first id digit", () => {
      cy.get(".searchInput")
        .type("1")
        .wait(1000) // wait for debounce
        .then(() =>
          expectDisplaysTableWithData(expectedData.searchSingleDigit)
        );
    });

    it("finds one customer when seaching for unique id", () => {
      cy.get(".searchInput")
        .type("67")
        .wait(1000) // wait for debounce
        .then(() => expectDisplaysTableWithData(expectedData.searchId));
    });
  });

  context("Filtering", () => {
    it("Displays all customers when removing filters", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Newsletter: Ja")
        .click()
        .then(() =>
          expectDisplaysTableWithData(expectedData.filterNewsletterYes)
        )
        .get(".multiSelectItem_clear")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("finds customers by filtering for 'Beitritt vor > 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor > 1 Jahr")
        .click()
        .then(() =>
          expectDisplaysTableWithData(
            expectedData.filterRegistrationOlderThan1Year
          )
        );
    });

    it("finds customers by filtering for 'Beitritt vor < 1 Jahr'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Beitritt vor < 1 Jahr")
        .click()
        .then(() =>
          expectDisplaysTableWithData(
            expectedData.filterRegistrationNewerThan1Year
          )
        );
    });
  });

  context("Editing", () => {
    afterEach(resetTestData);

    it("Displays correct data in Edit Popup", () => {
      let customer = expectedData.customerToEdit;
      cy.get("table").contains(customer.firstname).click({ force: true });
      cy.get("#firstname").should("have.value", customer.firstname);
      cy.get("#lastname").should("have.value", customer.lastname);
      cy.get("#email").should("have.value", customer.email);
      cy.get("#telephone_number").should(
        "have.value",
        customer.telephone_number
      );
      if (customer.subscribed_to_newsletter) {
        cy.get("#subscribed_to_newsletter").should("have.class", "-checked");
      } else {
        cy.get("#subscribed_to_newsletter").should(
          "not.have.class",
          "-checked"
        );
      }
      cy.get("#street").should("have.value", customer.street);
      cy.get("#house_number").should("have.value", customer.house_number);
      cy.get("#postal_code").should("have.value", customer.postal_code);
      cy.get("#city").should("have.value", customer.city);
      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        customer.registration_date
      );
      cy.get(".group row:nth-child(3) .datepicker input").should(
        "have.value",
        customer.renewed_on
      );
      customer.heard
        .split(",")
        .forEach((heard) =>
          cy
            .get(".group row:nth-child(4) .selectContainer")
            .should("contain.text", heard)
        );

      cy.get("#id").should("have.value", customer.id);
      cy.get("#remark").should("have.value", customer.remark);
    });

    it("Saves changes", () => {
      let customer = expectedData.customerToEdit;
      cy.get("table").contains(customer.firstname).click();
      cy.get("#firstname").clear().type("NewFirstname");
      cy.contains("Speichern").click();

      waitForLoadingOverlayToDisappear();
      expectDisplaysRow(
        expectedData.sortedByIdAsc[13].map((expectedValue) => {
          if (expectedValue.text === customer.firstname) {
            expectedValue.text = "NewFirstname";
          }
          return expectedValue;
        })
      );
    });

    it("Deletes customer", () => {
      let customer = expectedData.customerToEdit;
      cy.get("table").contains(customer.firstname).click();
      cy.contains("Löschen").click();
      waitForLoadingOverlayToDisappear();
      expectNotDisplaysRow(expectedData.sortedByIdAsc[13]);
    });

    it("Creates customer", () => {
      const newCustomer = {
        id: "101",
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

      cy.get("#id").should("have.value", "101");
      cy.get(".group row:nth-child(2) .datepicker input").should(
        "have.value",
        "01.06.2020"
      );

      cy.get("#firstname").type(newCustomer.firstname);
      cy.get("#lastname").type(newCustomer.lastname);
      cy.get("#email").type(newCustomer.email);
      cy.get("#telephone_number").type(newCustomer.telephone_number);
      cy.get("#subscribed_to_newsletter").click();
      cy.get("#street")
        .type(newCustomer.street)
        .wait(500)
        .get("body")
        .click(0, 0);
      cy.get("#house_number").type(newCustomer.house_number);
      cy.get("#postal_code")
        .type(newCustomer.postal_code)
        .wait(500)
        .get("body")
        .click(0, 0);
      cy.get("body").click();
      cy.get("#city").type(newCustomer.city);
      cy.get("#remark").type(newCustomer.remark);

      cy.contains("Speichern").click();
      waitForLoadingOverlayToDisappear();
      cy.get("thead").contains("Id").click();

      expectDisplaysRow(expectedData.createdCustomer);
    });
  });
});
