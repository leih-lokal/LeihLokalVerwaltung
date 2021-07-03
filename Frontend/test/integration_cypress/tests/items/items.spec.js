/// <reference types="cypress" />
const expectedData = {
  sortedByIdAsc: require("./expectedData/sortedByIdAsc.js"),
  sortedByIdDesc: require("./expectedData/sortedByIdDesc.js"),
  sortedByNameAsc: require("./expectedData/sortedByNameAsc.js"),
  sortedByNameDesc: require("./expectedData/sortedByNameDesc.js"),
  sortedByBrandAsc: require("./expectedData/sortedByBrandAsc.js"),
  sortedByBrandDesc: require("./expectedData/sortedByBrandDesc.js"),
  sortedByTypeAsc: require("./expectedData/sortedByTypeAsc.js"),
  sortedByTypeDesc: require("./expectedData/sortedByTypeDesc.js"),
  searchForIdDigits: require("./expectedData/searchForIdDigits.js"),
  searchForSynonym: require("./expectedData/searchForSynonym.js"),
  searchForUniqueId: require("./expectedData/searchForUniqueId.js"),
  searchForNameType: require("./expectedData/searchForNameType.js"),
  filterForAusgeliehen: require("./expectedData/filterForAusgeliehen.js"),
  filterForCategoryFreizeit: require("./expectedData/filterForCategoryFreizeit.js"),
  filterForCategoryGarten: require("./expectedData/filterForCategoryGarten.js"),
  filterForCategoryHaushalt: require("./expectedData/filterForCategoryHaushalt.js"),
  filterForCategoryKinder: require("./expectedData/filterForCategoryKinder.js"),
  filterForCategoryKueche: require("./expectedData/filterForCategoryKueche.js"),
  filterForGeloescht: require("./expectedData/filterForGeloescht.js"),
  filterForVerfuegbar: require("./expectedData/filterForVerfuegbar.js"),
  filterForCategoryHeimwerker: require("./expectedData/filterForCategoryHeimwerker.js"),
  noFilters: require("./expectedData/noFilters.js"),
  filterForCategoryFreizeitAndGeloescht: require("./expectedData/filterForCategoryFreizeitAndGeloescht.js"),
  itemToEdit: require("./expectedData/itemToEdit.js"),
  editedName: require("./expectedData/editedName.js"),
  deletedItem: require("./expectedData/deletedItem.js"),
  createdItem: require("./expectedData/createdItem.js"),
  createdDefaultItem: require("./expectedData/createdDefaultItem.js"),
};

const {
  resetTestData,
  waitForLoadingOverlayToDisappear,
  dateToString,
  waitForPopupToClose,
} = require("../../utils.js");

const expectDisplaysTableWithData = (expectedDataToBeDisplayed) => {
  cy.expectDisplaysTableData(expectedDataToBeDisplayed);
};

context("items", () => {
  beforeEach(() => {
    cy.visit("../../public/index.html#/items").then(() => cy.get("tbody > tr"));
  });

  context("Sorting", () => {
    it("sorts items by id asc", () => {
      expectDisplaysTableWithData(expectedData.sortedByIdAsc);
    });

    it("sorts items by id desc", () => {
      cy.get("thead").contains("Id").click();
      expectDisplaysTableWithData(expectedData.sortedByIdDesc);
    });

    it("sorts items by name asc", () => {
      cy.get("thead").contains("Gegenstand").click();
      expectDisplaysTableWithData(expectedData.sortedByNameAsc);
    });

    it("sorts items by name desc", () => {
      cy.get("thead").contains("Gegenstand").click();
      cy.get("thead").contains("Gegenstand").click();
      expectDisplaysTableWithData(expectedData.sortedByNameDesc);
    });

    it("sorts items by type asc", () => {
      cy.get("thead").contains("Typbezeichnung").click();
      expectDisplaysTableWithData(expectedData.sortedByTypeAsc);
    });

    it("sorts items by type desc", () => {
      cy.get("thead").contains("Typbezeichnung").click();
      cy.get("thead").contains("Typbezeichnung").click();
      expectDisplaysTableWithData(expectedData.sortedByTypeDesc);
    });

    it("sorts items by brand asc", () => {
      cy.get("thead").contains("Marke").click();
      expectDisplaysTableWithData(expectedData.sortedByBrandAsc);
    });

    it("sorts items by brand desc", () => {
      cy.get("thead").contains("Marke").click();
      cy.get("thead").contains("Marke").click();
      expectDisplaysTableWithData(expectedData.sortedByBrandDesc);
    });
  });

  context("Searching", () => {
    it("finds a item by search for 'name type'", () => {
      cy.get(".searchInput").type("Stichsäge TPS").wait(1000); // wait for debounce
      expectDisplaysTableWithData(expectedData.searchForNameType);
    });

    it("finds two items when seaching for id digits", () => {
      cy.get(".searchInput").type("123").wait(1000); // wait for debounce
      expectDisplaysTableWithData(expectedData.searchForIdDigits);
    });

    it("finds one item when seaching for unique id", () => {
      cy.get(".searchInput").type("0403").wait(1000); // wait for debounce
      expectDisplaysTableWithData(expectedData.searchForUniqueId);
    });

    it("finds item when seaching for synonym", () => {
      cy.get(".searchInput").type("Wokpfanne").wait(1000); // wait for debounce
      expectDisplaysTableWithData(expectedData.searchForSynonym);
    });
  });

  context("Filtering", () => {
    const clearFilter = () => cy.get(".multiSelectItem_clear").click();

    beforeEach(clearFilter);

    it("displays all items when removing filters", () => {
      expectDisplaysTableWithData(expectedData.noFilters);
    });

    it("finds items by filtering for 'gelöscht'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains(/^gelöscht$/)
        .click();
      expectDisplaysTableWithData(expectedData.filterForGeloescht);
    });

    it("finds items by filtering for 'ausgeliehen'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("ausgeliehen")
        .click();
      expectDisplaysTableWithData(expectedData.filterForAusgeliehen);
    });

    it("finds items by filtering for 'verfügbar'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("verfügbar")
        .click();
      expectDisplaysTableWithData(expectedData.filterForVerfuegbar);
    });

    it("finds items by filtering for 'Kategorie Küche'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Küche")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryKueche);
    });

    it("finds items by filtering for 'Kategorie Garten'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Garten")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryGarten);
    });

    it("finds items by filtering for 'Kategorie Haushalt'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Haushalt")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryHaushalt);
    });

    it("finds items by filtering for 'Kategorie Heimwerker'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Heimwerker")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryHeimwerker);
    });

    it("finds items by filtering for 'Kategorie Kinder'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Kinder")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryKinder);
    });

    it("finds items by filtering for 'Kategorie Freizeit'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Freizeit")
        .click();
      expectDisplaysTableWithData(expectedData.filterForCategoryFreizeit);
    });

    it("finds items by filtering for 'Kategorie Freizeit' and 'gelöscht'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Freizeit")
        .click()
        .get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains(/^gelöscht$/)
        .click();
      expectDisplaysTableWithData(
        expectedData.filterForCategoryFreizeitAndGeloescht
      );
    });
  });

  context("Editing", () => {
    afterEach(resetTestData);

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(expectedData.itemToEdit.name).click();
      cy.get("#id").should("have.value", expectedData.itemToEdit.id);
      cy.get("#name").should("have.value", expectedData.itemToEdit.name);
      cy.get("#brand").should("have.value", expectedData.itemToEdit.brand);
      cy.get("#itype").should("have.value", expectedData.itemToEdit.itype);
      cy.get(
        ".col-input > .selectContainer > .multiSelectItem > .multiSelectItem_label"
      ).contains(expectedData.itemToEdit.category);
      cy.get("#deposit").should("have.value", expectedData.itemToEdit.deposit);
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        expectedData.itemToEdit.added
      );
      cy.get("#description").should(
        "have.value",
        expectedData.itemToEdit.description
      );
      cy.get("#parts").should("have.value", expectedData.itemToEdit.parts);
      cy.get(
        ":nth-child(5) > .group > :nth-child(2) > .col-input > .selectContainer"
      ).contains(expectedData.itemToEdit.status);
    });

    it("Saves changes", () => {
      cy.get("table").contains(expectedData.itemToEdit.name).click();
      cy.get("#name").clear().type("NewName");
      cy.contains("Speichern")
        .click()
        .then(waitForLoadingOverlayToDisappear)
        .then(() => {
          expectDisplaysTableWithData(expectedData.editedName);
        });
    });

    it("Deletes item", () => {
      cy.get("table").contains(expectedData.itemToEdit.name).click();
      cy.contains("Löschen")
        .click()
        .then(waitForLoadingOverlayToDisappear)
        .then(() => {
          expectDisplaysTableWithData(expectedData.deletedItem);
        });
    });

    it("Creates item", () => {
      const newItem = {
        id: 3,
        name: "name",
        brand: "brand",
        itype: "itype",
        category: "Haushalt",
        deposit: 15,
        parts: "3",
        added: new Date().getTime(),
        description: "description",
        status: "verfügbar",
      };

      cy.get("button").contains("+").click();

      // wait for value to load before replacing it
      cy.get("#id").invoke("val").should("not.be.empty");
      cy.get("#id").clear().type(newItem.id);

      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        dateToString(new Date())
      );

      cy.get("#name").type(newItem.name);
      cy.get("#brand").type(newItem.brand);
      cy.get("#itype").type(newItem.itype);
      cy.get(
        ":nth-child(2) > .group > :nth-child(2) > .col-input > .selectContainer"
      )
        .click()
        .contains(newItem.category)
        .click();
      cy.get("#deposit").type(newItem.deposit);
      cy.get("#description").type(newItem.description);
      cy.get("#parts").type(newItem.parts);
      cy.get(
        ":nth-child(5) > .group > :nth-child(2) > .col-input > .selectContainer"
      )
        .click()
        .contains(newItem.status)
        .click({ force: true });

      cy.contains("Speichern")
        .click()
        .then(waitForPopupToClose)
        .then(() => {
          expectDisplaysTableWithData(expectedData.createdItem);
        });
    });

    it("Creates item with default values", () => {
      cy.get("button").contains("+").click();

      // wait for value to load
      cy.get("#id").invoke("val").should("not.be.empty");

      cy.contains("Speichern")
        .click()
        .then(waitForPopupToClose)
        .then(() => cy.get("thead").contains("Id").click())
        .then(() => {
          expectDisplaysTableWithData(expectedData.createdDefaultItem);
        });
    });
  });
});
