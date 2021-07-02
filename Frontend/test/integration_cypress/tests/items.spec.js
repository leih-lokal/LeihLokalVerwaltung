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
};

const { resetTestData } = require("../utils.js");

let items;
let itemsNotDeleted;

const expectedDisplayValue = (item, itemKey) => {
  let expectedValue = item[itemKey];
  let colKey = columns.find((col) => col.key === itemKey).key;
  if (["added"].includes(colKey)) {
    if (expectedValue === 0) {
      expectedValue = "";
    } else {
      const date = new Date(expectedValue);
      expectedValue = dateToString(date);
    }
  } else if (colKey === "status") {
    expectedValue = statusOnWebsiteDisplayValue(expectedValue);
  } else if (colKey === "id") {
    expectedValue = String(expectedValue).padStart(4, "0");
  }
  return expectedValue ?? "";
};

const expectedDisplayedTableDataSortedBy = (key, items) => {
  let transformBeforeSort = (value) => value;
  if (key === "id" || key === "added") transformBeforeSort = parseInt;
  return items.sort(function (a, b) {
    var x = transformBeforeSort(a[key]);
    var y = transformBeforeSort(b[key]);
    return x < y ? -1 : x > y ? 1 : 0;
  });
};

const expectDisplaysItemsSortedBy = (
  items,
  sortKey = "id",
  reverse = false
) => {
  let expectedDisplayedTableDataSortedById = expectedDisplayedTableDataSortedBy(
    sortKey,
    items
  );
  if (reverse) expectedDisplayedTableDataSortedById.reverse();
  expectDisplaysItems(expectedDisplayedTableDataSortedById);
};

const expectDisplaysOnlyItemsWithIds = (ids) => {
  const itemsWithIds = ids.map((id) =>
    items.find((item) => parseInt(item.id) === parseInt(id))
  );
  expectDisplaysItems(itemsWithIds);
};

const expectDisplaysItems = (items) => {
  cy.get("table > tr").should("have.length", items.length);
  cy.get("table > tr").each((row, rowIndex) =>
    cy
      .wrap(row)
      .children("td")
      .each((cell, colIndex) =>
        cy
          .wrap(cell)
          .should(
            "have.css",
            "background-color",
            expectedBackgroundColorForRow(items, rowIndex)
          )
      )
      .each((cell, colIndex) => {
        if (
          columns[colIndex].isImageUrl &&
          items[rowIndex][columns[colIndex].key]
        ) {
          return cy
            .wrap(cell)
            .children("img")
            .should("have.attr", "src", items[rowIndex][columns[colIndex].key]);
        } else {
          return cy
            .wrap(cell)
            .should(
              "have.text",
              expectedDisplayValue(items[rowIndex], columns[colIndex].key)
            );
        }
      })
  );
};

const expectedBackgroundColorForRow = (items, rowIndex) => {
  if (items[rowIndex].hasOwnProperty("highlight")) {
    return items[rowIndex]["highlight"];
  } else {
    return rowIndex % 2 === 0
      ? ColorDefs.DEFAULT_ROW_BACKGROUND_EVEN
      : ColorDefs.DEFAULT_ROW_BACKGROUND_ODD;
  }
};

const expectDisplaysTableWithData = (expectedDataToBeDisplayed) => {
  cy.expectDisplaysTableData(expectedDataToBeDisplayed);
};

context("items", () => {
  beforeEach(() => {
    cy.visit("../../public/index.html#/items");
  });

  /** 
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
      
      */

  context("Editing", () => {
    const expectedDateInputValue = (millis) => {
      if (millis === 0) return "-";
      else return dateToString(new Date(millis));
    };

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(itemsNotDeleted[3].name).click({ force: true });
      cy.get("#item_id").should("have.value", itemsNotDeleted[3].id);
      cy.get("#name").should("have.value", itemsNotDeleted[3].name);
      cy.get("#brand").should("have.value", itemsNotDeleted[3].brand);
      cy.get("#itype").should("have.value", itemsNotDeleted[3].itype);
      cy.get(
        ":nth-child(3) > .group > :nth-child(2) > .col-input > .selectContainer"
      ).contains(itemsNotDeleted[3].category);
      cy.get("#deposit").should("have.value", itemsNotDeleted[3].deposit);
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        expectedDateInputValue(itemsNotDeleted[3].added)
      );
      cy.get("#description").should(
        "have.value",
        itemsNotDeleted[3].description
      );
      cy.get("#parts").should("have.value", itemsNotDeleted[3].parts);
      cy.get(
        ":nth-child(5) > .group > :nth-child(2) > .col-input > .selectContainer"
      ).contains(statusOnWebsiteDisplayValue(itemsNotDeleted[3].status));
    });

    it("Saves changes", () => {
      cy.get("table").contains(itemsNotDeleted[3].name).click({ force: true });
      cy.get("#name").clear().type("NewName");
      cy.contains("Speichern")
        .click()
        .then(() => {
          cy.wrap(Database.fetchItemById(itemsNotDeleted[3].id))
            .its("name")
            .should("eq", "NewName");
        });
    });

    it("Deletes item", () => {
      cy.get("table").contains(itemsNotDeleted[3].name).click();
      cy.contains("Löschen")
        .click()
        .then(() => {
          cy.wrap(Database.fetchItemById(itemsNotDeleted[3].id))
            .its("status")
            .should("eq", "deleted");
        });
    });

    it("Creates item", () => {
      const newItem = {
        id: items.length + 1,
        name: "name",
        brand: "brand",
        itype: "itype",
        category: "Haushalt",
        deposit: 15,
        parts: "3",
        added: new Date().getTime(),
        description: "description",
        status: "instock",
      };

      cy.contains("+").click();

      cy.get("#item_id").should("have.value", items.length + 1);
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        dateToString(new Date())
      );

      cy.get("#name").type(newItem.name);
      cy.get("#brand").type(newItem.brand);
      cy.get("#itype").type(newItem.itype);
      cy.get(
        ":nth-child(3) > .group > :nth-child(2) > .col-input > .selectContainer"
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
        .contains("verfügbar")
        .click({ force: true });

      cy.contains("Speichern")
        .click()
        .then(() => cy.wrap(Database.fetchItemById(newItem.id)))
        .then((item) => {
          expect(item.id).to.equal(newItem.id);
          expect(item.name).to.equal(newItem.name);
          expect(item.brand).to.equal(newItem.brand);
          expect(item.itype).to.equal(newItem.itype);
          expect(item.category).to.equal(newItem.category);
          expect(item.deposit).to.equal(newItem.deposit);
          expect(item.parts).to.equal(newItem.parts);
          expect(item.added).to.equal(millisAtStartOfDay(newItem.added));
          expect(item.description).to.equal(newItem.description);
          expect(item.status).to.equal(newItem.status);
        });
    });

    it("Creates item with default values", () => {
      const defaultItem = {
        added: millisAtStartOfToday(),
        brand: "",
        category: "",
        deposit: 0,
        description: "",
        exists_more_than_once: false,
        highlight: "",
        id: 16,
        image: "",
        itype: "",
        manual: "",
        name: "",
        package: "",
        parts: "",
        status: "instock",
        synonyms: "",
        type: "item",
        wc_id: "",
        wc_url: "",
      };

      cy.contains("+").click();

      cy.contains("Speichern")
        .click()
        .then(() => cy.wrap(Database.fetchItemById(defaultItem.id)))
        .then((item) => {
          for (let key of Object.keys(defaultItem)) {
            expect(item[key]).to.equal(defaultItem[key]);
          }
          expect(item._id).to.have.length.of.at.least(1);
        });
    });
  });
});
