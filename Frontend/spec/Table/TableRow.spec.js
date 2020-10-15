import TableRow from "../../src/components/Table/TableRow.svelte";
import { render, fireEvent } from "@testing-library/svelte";

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

const row = {
  _id: 0,
  firstname: "pljrtbr",
  lastname: "sdvbtrr",
};

describe("TableRow", () => {
  const renderTableRow = () => {
    const { container, component } = render(TableRow, {
      props: {
        columns: columns,
        item: row,
      },
    });

    return {
      cells: container.querySelectorAll("tr > td"),
      clickOnRow: async () => await fireEvent.click(container.querySelector("tr")),
      component: component,
    };
  };

  it("displays a value for each column", () => {
    const { cells } = renderTableRow();

    expect(cells.length).toEqual(columns.length);
    cells.forEach((cell, i) => {
      expect(cell).toHaveTextContent(row[columns[i].key]);
    });
  });

  it("fires click event", async () => {
    const { component, clickOnRow } = renderTableRow();

    listen(component, "click");
    await clickOnRow();
    expect(component).toHaveFiredEvent("click");
  });
});
