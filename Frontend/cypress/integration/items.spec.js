/// <reference types="cypress" />
import data from "../../spec/Database/DummyData/items";
import ColorDefs from "../../src/components/Input/ColorDefs";
import columns from "../../src/components/TableEditors/Items/Columns";
import {
  dateToString,
  statusOnWebsiteDisplayValue,
  waitForPopupToClose,
  clearFilter,
} from "./utils";

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
  } else if (colKey === "status_on_website") {
    expectedValue = statusOnWebsiteDisplayValue(expectedValue);
  }
  return expectedValue ?? "";
};

const expectedDisplayedTableDataSortedBy = (key, items) => {
  let transformBeforeSort = (value) => value;
  if (key === "_id" || key === "added") transformBeforeSort = parseInt;
  return items.sort(function (a, b) {
    var x = transformBeforeSort(a[key]);
    var y = transformBeforeSort(b[key]);
    return x < y ? -1 : x > y ? 1 : 0;
  });
};

const expectDisplaysItemsSortedBy = (items, sortKey = "_id", reverse = false) => {
  let expectedDisplayedTableDataSortedById = expectedDisplayedTableDataSortedBy(sortKey, items);
  if (reverse) expectedDisplayedTableDataSortedById.reverse();
  expectDisplaysItems(expectedDisplayedTableDataSortedById);
};

const expectDisplaysOnlyItemsWithIds = (ids) => {
  const itemsWithIds = ids.map((id) => items.find((item) => parseInt(item._id) === parseInt(id)));
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
          .should("have.css", "background-color", expectedBackgroundColorForRow(items, rowIndex))
      )
      .each((cell, colIndex) => {
        if (columns[colIndex].isImageUrl && items[rowIndex][columns[colIndex].key]) {
          return cy
            .wrap(cell)
            .children("img")
            .should("have.attr", "src", items[rowIndex][columns[colIndex].key]);
        } else {
          return cy
            .wrap(cell)
            .should("have.text", expectedDisplayValue(items[rowIndex], columns[colIndex].key));
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

context("items", () => {
  beforeEach(() => {
    items = JSON.parse(JSON.stringify(data));
    itemsNotDeleted = items.filter((item) => item.status_on_website !== "deleted");
    window.indexedDB
      .databases()
      .then((dbs) => dbs.forEach((db) => window.indexedDB.deleteDatabase(db.name)));
    cy.visit("../../public/index.html").get("nav").contains("Gegenstände").click();
  });

  it("displays correct number of items", () => {
    cy.get("table > tr").should("have.length", itemsNotDeleted.length);
  });

  context("Sorting", () => {
    it("sorts items by id", () => {
      expectDisplaysItemsSortedBy(itemsNotDeleted, "_id");
    });

    it("sorts items by id reverse", () => {
      cy.get("thead").contains("Id").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "_id", true);
    });

    it("sorts items by name", () => {
      cy.get("thead").contains("Gegenstand").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "item_name");
    });

    it("sorts items by name reverse", () => {
      cy.get("thead").contains("Gegenstand").click();
      cy.get("thead").contains("Gegenstand").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "item_name", true);
    });

    it("sorts items by type", () => {
      cy.get("thead").contains("Typbezeichnung").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "itype");
    });

    it("sorts items by type reverse", () => {
      cy.get("thead").contains("Typbezeichnung").click();
      cy.get("thead").contains("Typbezeichnung").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "itype", true);
    });

    it("sorts items by brand", () => {
      cy.get("thead").contains("Marke").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "brand");
    });

    it("sorts items by brand reverse", () => {
      cy.get("thead").contains("Marke").click();
      cy.get("thead").contains("Marke").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "brand", true);
    });

    it("sorts items by category", () => {
      cy.get("thead").contains("Kategorie").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "category");
    });

    it("sorts items by category reverse", () => {
      cy.get("thead").contains("Kategorie").click();
      cy.get("thead").contains("Kategorie").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "category", true);
    });

    it("sorts items by added", () => {
      cy.get("thead").contains("Erfasst am").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "added");
    });

    it("sorts items by added reverse", () => {
      cy.get("thead").contains("Erfasst am").click();
      cy.get("thead").contains("Erfasst am").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "added", true);
    });

    it("sorts items by status", () => {
      cy.get("thead").contains("Status").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "status_on_website");
    });

    it("sorts items by status reverse", () => {
      cy.get("thead").contains("Status").click();
      cy.get("thead").contains("Status").click();
      expectDisplaysItemsSortedBy(itemsNotDeleted, "status_on_website", true);
    });
  });

  context("Searching", () => {
    beforeEach(clearFilter);

    it("finds a item by search for 'name type'", () => {
      cy.get(".searchInput").type(items[14].item_name + " " + items[14].itype, { force: true });
      expectDisplaysOnlyItemsWithIds([items[14]._id]);
    });

    it("finds two items when seaching for first id digit", () => {
      cy.get(".searchInput").type("1", { force: true });
      expectDisplaysOnlyItemsWithIds(["1", "10", "11", "12", "13", "14", "15"]);
    });

    it("finds one item when seaching for unique id", () => {
      cy.get(".searchInput").type("2", { force: true });
      expectDisplaysOnlyItemsWithIds(["2"]);
    });

    it("finds item when seaching for synonym", () => {
      cy.get(".searchInput").type("Bohrer", { force: true });
      expectDisplaysOnlyItemsWithIds(["7"]);
    });
  });

  context("Filtering", () => {
    beforeEach(clearFilter);

    it("displays all items when removing filters", () => {
      cy.get("table > tr").should("have.length", items.length);
      expectDisplaysItemsSortedBy(items);
    });

    it("finds items by filtering for 'nicht gelöscht'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("nicht gelöscht").click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.status_on_website !== "deleted").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'gelöscht'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains(/^gelöscht$/)
        .click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.status_on_website === "deleted").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'ausgeliehen'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("ausgeliehen").click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.status_on_website === "outofstock").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'verfügbar'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("verfügbar").click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.status_on_website === "instock").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'Kategorie Küche'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Kategorie Küche").click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.category === "Küche").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'Kategorie Garten'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Kategorie Garten").click();
      cy.get("table > tr").should("have.length", 0);
    });

    it("finds items by filtering for 'Kategorie Haushalt'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Haushalt")
        .click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.category === "Haushalt").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'Kategorie Heimwerker'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Heimwerker")
        .click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.category === "Heimwerker").map((item) => item._id)
      );
    });

    it("finds items by filtering for 'Kategorie Kinder'", () => {
      cy.get(".selectContainer").click().get(".listContainer").contains("Kategorie Kinder").click();
      cy.get("table > tr").should("have.length", 0);
    });

    it("finds items by filtering for 'Kategorie Freizeit'", () => {
      cy.get(".selectContainer")
        .click()
        .get(".listContainer")
        .contains("Kategorie Freizeit")
        .click();
      expectDisplaysOnlyItemsWithIds(
        items.filter((item) => item.category === "Freizeit").map((item) => item._id)
      );
    });
  });

  context("Editing", () => {
    const expectedDateInputValue = (millis) => {
      if (millis === 0) return "-";
      else return dateToString(new Date(millis));
    };

    it("Displays correct data in Edit Popup", () => {
      cy.get("table").contains(itemsNotDeleted[3].item_name).click({ force: true });
      cy.get("#item_id").should("have.value", itemsNotDeleted[3]._id);
      cy.get("#item_name").should("have.value", itemsNotDeleted[3].item_name);
      cy.get("#brand").should("have.value", itemsNotDeleted[3].brand);
      cy.get("#itype").should("have.value", itemsNotDeleted[3].itype);
      cy.get(":nth-child(3) > .group > :nth-child(2) > .col-input > .selectContainer").contains(
        itemsNotDeleted[3].category
      );
      cy.get("#deposit").should("have.value", itemsNotDeleted[3].deposit);
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        expectedDateInputValue(itemsNotDeleted[3].added)
      );
      cy.get("#description").should("have.value", itemsNotDeleted[3].description);
      cy.get("#parts").should("have.value", itemsNotDeleted[3].parts);
      cy.get(":nth-child(5) > .group > :nth-child(2) > .col-input > .selectContainer").contains(
        statusOnWebsiteDisplayValue(itemsNotDeleted[3].status_on_website)
      );
    });

    it("Saves changes", () => {
      cy.get("table").contains(itemsNotDeleted[3].item_name).click({ force: true });
      cy.get("#item_name").clear().type("NewName");
      cy.contains("Speichern").click();
      waitForPopupToClose();
      itemsNotDeleted[3].item_name = "NewName";
      expectDisplaysItemsSortedBy(itemsNotDeleted);
    });

    it("Deletes item", () => {
      cy.get("table").contains(itemsNotDeleted[3].item_name).click({ force: true });
      cy.contains("Löschen").click();
      itemsNotDeleted[3].status_on_website = "deleted";
      waitForPopupToClose();
      expectDisplaysOnlyItemsWithIds(
        itemsNotDeleted
          .filter((item) => item._id !== itemsNotDeleted[3]._id)
          .map((item) => item._id)
      );
    });

    it("Creates item", () => {
      const newItem = {
        _id: String(items.length + 1),
        item_name: "name",
        brand: "brand",
        itype: "itype",
        category: "Haushalt",
        deposit: 15,
        parts: "parts",
        added: new Date().getTime(),
        description: "description",
        status_on_website: "instock",
      };

      cy.contains("+").click();

      cy.get("#item_id").should("have.value", items.length + 1);
      cy.get(".group row:nth-child(4) .datepicker input").should(
        "have.value",
        dateToString(new Date())
      );

      cy.get("#item_name").type(newItem.item_name);
      cy.get("#brand").type(newItem.brand);
      cy.get("#itype").type(newItem.itype);
      cy.get(":nth-child(3) > .group > :nth-child(2) > .col-input > .selectContainer")
        .click()
        .contains(newItem.category)
        .click();
      cy.get("#deposit").type(newItem.deposit);
      cy.get("#description").type(newItem.description);
      cy.get("#parts").type(newItem.parts);
      cy.get(":nth-child(5) > .group > :nth-child(2) > .col-input > .selectContainer")
        .click()
        .contains("verfügbar")
        .click({ force: true });

      cy.contains("Speichern").click();
      waitForPopupToClose();
      clearFilter();

      items.push(newItem);
      expectDisplaysItems(items);
    });
  });
});
