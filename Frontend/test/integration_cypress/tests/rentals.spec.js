/// <reference types="cypress" />

const expectedData = {
  sortedByIdAsc: require("./expectedData/sortedByIdAsc.js"),
};

const expectDisplaysTableWithData = (expectedDataToBeDisplayed) => {
  cy.expectDisplaysTableData(expectedDataToBeDisplayed);
};

const TODAY = Date.UTC(2021, 2, 28);

context("rentals", () => {
  beforeEach(() => {
    cy.clock(TODAY, ["Date"]);
    cy.visit("../../public/index.html#/rentals");
  });

  context("Sorting", () => {
    it("sorts by to return on asc", () => {
      expectDisplaysTableWithData(expectedData.sortedByIdAsc);
    });

    it("sorts by to return on desc", () => {
      cy.get("thead")
        .contains("Zurückerwartet")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by number asc", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by number desc", () => {
      cy.get("thead")
        .contains("Gegenstand Nr")
        .click()
        .get("thead")
        .contains("Gegenstand Nr")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by item_name asc", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by item_name desc", () => {
      cy.get("thead")
        .contains("Gegenstand Name")
        .click()
        .get("thead")
        .contains("Gegenstand Name")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by customer_id asc", () => {
      cy.get("thead")
        .contains("Kunde Nr")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by customer_id reverse desc", () => {
      cy.get("thead")
        .contains("Kunde Nr")
        .click()
        .get("thead")
        .contains("Kunde Nr")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by customer_name asc", () => {
      cy.get("thead")
        .contains("Kunde Name")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });

    it("sorts rentals by customer_name desc", () => {
      cy.get("thead")
        .contains("Kunde Name")
        .click()
        .get("thead")
        .contains("Kunde Name")
        .click()
        .then(() => expectDisplaysTableWithData(expectedData.sortedByIdAsc));
    });
  });

  /*

  context("Searching", () => {
    beforeEach(clearFilter);

    it("finds a rental by search for item_id", () => {
      cy.get(".searchInput")
        .type(10, { force: true })
        .then(() =>
          expectDisplaysOnlyRentalsWithIds([
            "00b2e7344faa8300caa973a712445c01",
            "00a8d5c18c7377bf6e3802faaac1a089",
          ])
        );
    });

    it("finds a rental by search for item_name", () => {
      cy.get(".searchInput")
        .type(rentals[4].item_name, { force: true })
        .then(() => expectDisplaysOnlyRentalsWithIds([rentals[4]._id]));
    });

    it("finds a rental by search for customer_name", () => {
      cy.get(".searchInput")
        .type(rentals[4].customer_name, { force: true })
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
      cy.get("#customer_name").should("have.value", rentals[4].customer_name);
      cy.get("#deposit").should("have.value", rentals[4].deposit);
      cy.get("#deposit_returned").should("have.value", rentals[4].deposit_returned);

      cy.get("#passing_out_employee").should("have.value", rentals[4].passing_out_employee);
      cy.get("#receiving_employee").should("have.value", rentals[4].receiving_employee);
      cy.get("#remark").should("have.value", rentals[4].remark);
    });

    it("Saves changes", () => {
      cy.get("table")
        .contains(rentals[4].item_name)
        .click({ force: true })
        .get("#deposit")
        .clear()
        .type(3);
      cy.contains("Speichern").click();
      cy.contains("Leihvorgang gespeichert").then(() => {
        cy.wrap(
          Database.fetchRentalByItemAndCustomerIds(rentals[4].item_id, rentals[4].customer_id)
        )
          .its("deposit")
          .should("eq", 3);
      });
    });

    it("Deletes rental", () => {
      cy.get("table").contains(rentals[4].item_name).click({ force: true });
      cy.contains("Löschen")
        .click()
        .then(() => {
          cy.wrap(
            Database.fetchRentalByItemAndCustomerIds(rentals[4].item_id, rentals[4].customer_id)
          ).should("deep.equal", {});
        });
    });

    it("Creates rental", () => {
      const newRental = {
        item_id: 1,
        item_name: "Dekupiersäge",
        rented_on: Date.UTC(2020, 0, 1),
        to_return_on: Date.UTC(2020, 0, 8),
        passing_out_employee: "MM",
        customer_id: 5,
        returned_on: 0,
        customer_name: "Viviana",
        deposit: 15,
        deposit_returned: 0,
        expectedCellBackgroundColors: columns.map((col) => {
          if (col.key === "item_id" || col.key === "item_name") return COLORS.HIGHLIGHT_BLUE;
          else return COLORS.DEFAULT_ROW_BACKGROUND_ODD;
        }),
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
      cy.get(".autocomplete-list-item").contains(newRental.customer_name).click();
      cy.get("#customer_name").clear().type(newRental.customer_name);
      cy.get(".autocomplete-list-item").contains(newRental.customer_name).click();
      cy.get("#deposit").clear().type(newRental.deposit);
      cy.get("#passing_out_employee").type(newRental.passing_out_employee);

      cy.contains("Speichern").click();
      cy.contains("Leihvorgang gespeichert")
        .then(() =>
          cy.wrap(
            Database.fetchRentalByItemAndCustomerIds(newRental.item_id, newRental.customer_id)
          )
        )
        .then((rental) => {
          expect(rental.image).to.equal(
            "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/005.jpg"
          );
          for (let key of Object.keys(newRental).filter(
            (key) => key !== "expectedCellBackgroundColors"
          )) {
            expect(rental[key]).to.equal(newRental[key]);
          }
        });
    });

    it("Creates rental with default values", () => {
      const defaultRental = {
        item_id: 0,
        item_name: "",
        rented_on: millisAtStartOfDay(TODAY),
        to_return_on: millisAtStartOfDay(IN_ONE_WEEK),
        passing_out_employee: "",
        receiving_employee: "",
        customer_id: 0,
        returned_on: 0,
        extended_on: 0,
        customer_name: "",
        deposit: 0,
        deposit_returned: 0,
        image: "",
        remark: "",
        type: "rental",
      };

      cy.contains("+").click();

      cy.contains("Speichern").click();
      cy.contains("Leihvorgang gespeichert")
        .then(() =>
          cy.wrap(
            Database.fetchRentalByItemAndCustomerIds(
              defaultRental.item_id,
              defaultRental.customer_id
            )
          )
        )
        .then((rental) => {
          for (let key of Object.keys(defaultRental)) {
            expect(rental[key]).to.equal(defaultRental[key]);
          }
        });
    });
  });*/
});
