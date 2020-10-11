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

  it("renders all column headers", () => {
    const { container } = render(TableHeader, {
      props: {
        columns: columns,
      },
    });

    const columnHeaderElements = container.querySelectorAll("thead > tr > th");
    expect(columnHeaderElements.length).toEqual(columns.length);
    columnHeaderElements.forEach((headerElement, i) => {
      expect(headerElement.textContent).toContain(columns[i].title);
    });
  });

  it("sorts all rows by id on initial render", () => {
    const { container } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    expectSortedByColumnKey(rowsIn(container), "_id");
  });

  it("sorts all rows by column on click", async () => {
    const { container, getByText } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    await fireEvent.click(getByText("Nachname"));
    expectSortedByColumnKey(rowsIn(container), "lastname");

    await fireEvent.click(getByText("Vorname"));
    expectSortedByColumnKey(rowsIn(container), "firstname");

    await fireEvent.click(getByText("Id"));
    expectSortedByColumnKey(rowsIn(container), "_id");
  });

  it("inverts order of rows on click", async () => {
    const { container, getByText } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    for (let i = 0; i < 10; i++) {
      expectSortedByColumnKey(rowsIn(container), "_id", i % 2 !== 0);
      await fireEvent.click(getByText("Id"));
    }

    await fireEvent.click(getByText("Vorname"));
    for (let i = 0; i < 10; i++) {
      expectSortedByColumnKey(rowsIn(container), "firstname", i % 2 !== 0);
      await fireEvent.click(getByText("Vorname"));
    }

    await fireEvent.click(getByText("Nachname"));
    for (let i = 0; i < 10; i++) {
      expectSortedByColumnKey(rowsIn(container), "lastname", i % 2 !== 0);
      await fireEvent.click(getByText("Nachname"));
    }

    await fireEvent.click(getByText("Id"));
    await fireEvent.click(getByText("Id"));
    await fireEvent.click(getByText("Nachname"));
    expectSortedByColumnKey(rowsIn(container), "lastname");
    await fireEvent.click(getByText("Id"));
    expectSortedByColumnKey(rowsIn(container), "_id");
  });

  it("applies sort function defined in columns", () => {
    const { container } = render(TableHeaderTest, {
      props: {
        columns: columnsWithSortFunction,
        rows: rows,
      },
    });

    expectSortedByColumnKey(rowsIn(container), "_id", false, parseInt);
  });

  it("initially sorts descending as defined in columns", () => {
    const { container } = render(TableHeaderTest, {
      props: {
        columns: columnsWithInitialSortLastnameDesc,
        rows: rows,
      },
    });

    expectSortedByColumnKey(rowsIn(container), "lastname", true);
  });

  it("initially sorts ascending as defined in columns", () => {
    const { container } = render(TableHeaderTest, {
      props: {
        columns: columnsWithInitialSortLastnameAsc,
        rows: rows,
      },
    });

    expectSortedByColumnKey(rowsIn(container), "lastname");
  });

  it("shows a sort indicator on current sort column header", async () => {
    const { container, getByText } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    const expectToIndicateSort = (colNumber, order) => {
      if (order === "none") {
        container
          .querySelectorAll(`th:nth-of-type(${colNumber}) > span`)
          .forEach((icon) => expect(icon.classList).not.toContain("visible"));
      } else {
        const asc = order === "asc";
        expect(
          container.querySelector(
            `th:nth-of-type(${colNumber}) > .sort-indicator-${asc ? "down" : "up"}`
          ).classList
        ).toContain("visible");
        expect(
          container.querySelector(
            `th:nth-of-type(${colNumber}) > .sort-indicator-${asc ? "up" : "down"}`
          ).classList
        ).not.toContain("visible");
      }
    };

    expectToIndicateSort(1, "asc");
    expectToIndicateSort(2, "none");
    expectToIndicateSort(3, "none");

    await fireEvent.click(getByText("Id"));

    expectToIndicateSort(1, "desc");
    expectToIndicateSort(2, "none");
    expectToIndicateSort(3, "none");

    await fireEvent.click(getByText("Nachname"));

    expectToIndicateSort(1, "none");
    expectToIndicateSort(2, "asc");
    expectToIndicateSort(3, "none");

    await fireEvent.click(getByText("Nachname"));

    expectToIndicateSort(1, "none");
    expectToIndicateSort(2, "desc");
    expectToIndicateSort(3, "none");

    await fireEvent.click(getByText("Nachname"));

    expectToIndicateSort(1, "none");
    expectToIndicateSort(2, "asc");
    expectToIndicateSort(3, "none");
  });

  it("shows a sort indicator on mouseOver", async () => {
    const { container } = render(TableHeaderTest, {
      props: {
        columns: columns,
        rows: rows,
      },
    });

    expect(container.querySelector("th:nth-of-type(2) > .sort-indicator").classList).not.toContain(
      "visible"
    );

    await fireEvent.mouseOver(container.querySelector("th:nth-of-type(2)"));

    expect(container.querySelector("th:nth-of-type(2) > .sort-indicator").classList).toContain(
      "visible"
    );

    await fireEvent.mouseOut(container.querySelector("th:nth-of-type(2)"));

    expect(container.querySelector("th:nth-of-type(2) > .sort-indicator").classList).not.toContain(
      "visible"
    );
  });
});
