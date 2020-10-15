import TableHeader from "../../src/components/Table/TableHeader.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import TableHeaderTest from "./TableHeaderTest.svelte";

const columns = [
  {
    title: "Id",
    key: "_id",
  },
  {
    title: "Nachname",
    key: "lastname",
  },
  {
    title: "Vorname",
    key: "firstname",
  },
];

const columnsWithSortFunction = [
  {
    title: "Id",
    key: "_id",
    sort: (value) => parseInt(value),
  },
  {
    title: "Nachname",
    key: "lastname",
  },
  {
    title: "Vorname",
    key: "firstname",
  },
];

const columnsWithInitialSortLastnameDesc = [
  {
    title: "Id",
    key: "_id",
  },
  {
    title: "Nachname",
    key: "lastname",
    initialSort: "desc",
  },
  {
    title: "Vorname",
    key: "firstname",
  },
];

const columnsWithInitialSortLastnameAsc = [
  {
    title: "Id",
    key: "_id",
  },
  {
    title: "Nachname",
    key: "lastname",
    initialSort: "asc",
  },
  {
    title: "Vorname",
    key: "firstname",
  },
];

const rows = [
  {
    _id: "2",
    lastname: "GHI",
    firstname: "ABC",
  },
  {
    _id: "3",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "1",
    lastname: "ABC",
    firstname: "GHI",
  },
  {
    _id: "4",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "5",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "6",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "7",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "8",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "9",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "10",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "11",
    lastname: "DEF",
    firstname: "DEF",
  },
  {
    _id: "12",
    lastname: "DEF",
    firstname: "DEF",
  },
];

function expectSortedByColumnKey(
  actualRows,
  columnKey,
  invert = false,
  preprocess = (value) => value
) {
  const expectedRows = rows
    .sort((a, b) => {
      if (preprocess(a[columnKey]) > preprocess(b[columnKey])) {
        return invert ? -1 : 1;
      }
      if (preprocess(b[columnKey]) > preprocess(a[columnKey])) {
        return invert ? 1 : -1;
      }
      return 0;
    })
    .map((row) => JSON.stringify(row));

  expect(actualRows.map((row) => row.textContent)).toMatchObject(expectedRows);
}

describe(TableHeader.name, () => {
  const rowsIn = (container) => Array.from(container.querySelectorAll(".row"));

  const renderWithColumns = (columns) => {
    const { container, getByText } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    return {
      tableRows: () => rowsIn(container),
      clickOnColumnHeader: async (title) => await fireEvent.click(getByText(title)),
      mouseOverColumnHeader: async (title) => await fireEvent.mouseOver(getByText(title)),
      mouseOutColumnHeader: async (title) => await fireEvent.mouseOut(getByText(title)),
      columnHeaders: () => container.querySelectorAll("thead > tr > th"),
    };
  };

  it("renders all column headers", () => {
    const { columnHeaders } = renderWithColumns(columns);

    expect(columnHeaders().length).toEqual(columns.length);
    columnHeaders().forEach((headerElement, i) => {
      expect(headerElement.textContent).toContain(columns[i].title);
    });
  });

  it("sorts all rows by id on initial render", () => {
    const { tableRows } = renderWithColumns(columns);
    expectSortedByColumnKey(tableRows(), "_id");
  });

  it("sorts all rows by column on click", async () => {
    const { tableRows, clickOnColumnHeader } = renderWithColumns(columns);

    await clickOnColumnHeader("Nachname");
    expectSortedByColumnKey(tableRows(), "lastname");

    await clickOnColumnHeader("Vorname");
    expectSortedByColumnKey(tableRows(), "firstname");

    await clickOnColumnHeader("Id");
    expectSortedByColumnKey(tableRows(), "_id");
  });

  it("inverts sort order on second click", async () => {
    const { tableRows, clickOnColumnHeader } = renderWithColumns(columns);

    for (let i = 0; i < 10; i++) {
      expectSortedByColumnKey(tableRows(), "_id", i % 2 !== 0);
      await clickOnColumnHeader("Id");
    }

    for (let i = 0; i < 10; i++) {
      await clickOnColumnHeader("Vorname");
      expectSortedByColumnKey(tableRows(), "firstname", i % 2 !== 0);
    }

    for (let i = 0; i < 10; i++) {
      await clickOnColumnHeader("Nachname");
      expectSortedByColumnKey(tableRows(), "lastname", i % 2 !== 0);
    }

    await clickOnColumnHeader("Id");
    await clickOnColumnHeader("Id");
    await clickOnColumnHeader("Nachname");
    expectSortedByColumnKey(tableRows(), "lastname");
    await clickOnColumnHeader("Id");
    expectSortedByColumnKey(tableRows(), "_id");
  });

  it("applies sort function defined in columns", () => {
    const { tableRows } = renderWithColumns(columnsWithSortFunction);
    expectSortedByColumnKey(tableRows(), "_id", false, parseInt);
  });

  it("initially sorts descending as defined in columns", () => {
    const { tableRows } = renderWithColumns(columnsWithInitialSortLastnameDesc);
    expectSortedByColumnKey(tableRows(), "lastname", true);
  });

  it("initially sorts ascending as defined in columns", () => {
    const { tableRows } = renderWithColumns(columnsWithInitialSortLastnameAsc);
    expectSortedByColumnKey(tableRows(), "lastname");
  });

  describe("sort indicators", () => {
    const expectToIndicateSort = (colHeaders, expectedIndicationDirections) => {
      const sortIndicator = (colHeader) => colHeader.querySelector(".sort-indicator");
      const sortIndicatorUp = (colHeader) => colHeader.querySelector(".sort-indicator-up");
      const sortIndicatorDown = (colHeader) => colHeader.querySelector(".sort-indicator-down");

      expectedIndicationDirections.forEach((expectedIndicationDirection, i) => {
        if (expectedIndicationDirection === "none") {
          expect(sortIndicator(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorUp(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorDown(colHeaders[i]).classList).not.toContain("visible");
        } else if (expectedIndicationDirection === "asc") {
          expect(sortIndicator(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorUp(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorDown(colHeaders[i]).classList).toContain("visible");
        } else if (expectedIndicationDirection === "desc") {
          expect(sortIndicator(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorUp(colHeaders[i]).classList).toContain("visible");
          expect(sortIndicatorDown(colHeaders[i]).classList).not.toContain("visible");
        } else if (expectedIndicationDirection === "both") {
          expect(sortIndicator(colHeaders[i]).classList).toContain("visible");
          expect(sortIndicatorUp(colHeaders[i]).classList).not.toContain("visible");
          expect(sortIndicatorDown(colHeaders[i]).classList).not.toContain("visible");
        }
      });
    };

    it("shows a sort indicator on current sort column header", async () => {
      const { columnHeaders, clickOnColumnHeader } = renderWithColumns(columns);

      expectToIndicateSort(columnHeaders(), ["asc", "none", "none"]);

      await clickOnColumnHeader("Id");
      expectToIndicateSort(columnHeaders(), ["desc", "none", "none"]);

      await clickOnColumnHeader("Nachname");
      expectToIndicateSort(columnHeaders(), ["none", "asc", "none"]);

      await clickOnColumnHeader("Nachname");
      expectToIndicateSort(columnHeaders(), ["none", "desc", "none"]);

      await clickOnColumnHeader("Nachname");
      expectToIndicateSort(columnHeaders(), ["none", "asc", "none"]);
    });

    it("shows a sort indicator on mouseOver", async () => {
      const { columnHeaders, mouseOverColumnHeader, mouseOutColumnHeader } = renderWithColumns(
        columns
      );

      expectToIndicateSort(columnHeaders(), ["asc", "none", "none"]);

      await mouseOverColumnHeader("Nachname");
      expectToIndicateSort(columnHeaders(), ["asc", "both", "none"]);

      await mouseOutColumnHeader("Nachname");
      expectToIndicateSort(columnHeaders(), ["asc", "none", "none"]);
    });
  });
});
