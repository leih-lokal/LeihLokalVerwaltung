import Row from "../../src/components/Table/Row.svelte";
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
  {
    title: "Function Test",
    key: "functionTest",
    display: (value) => "functionTest1",
  },
  {
    title: "Image",
    key: "image",
    isImageUrl: true,
  },
];

const row = {
  _id: "0",
  firstname: "pljrtbr",
  functionTest: "functionTest",
  image: "url",
};

describe(Row.name, () => {
  const renderRow = () => {
    const { container, component } = render(Row, {
      props: {
        columns: columns,
        item: row,
      },
    });

    return {
      cells: container.querySelectorAll("tr > td"),
      clickOnRow: () => fireEvent.click(container.querySelector("tr")),
      component: component,
    };
  };

  it("displays a value for each column", () => {
    const { cells } = renderRow();
    expect(cells.length).toEqual(columns.length);

    cells.forEach((cell, i) => {
      const actualCellContent = cell.textContent.trim();
      const givenRowValue = row[columns[i].key];
      if (columns[i].isImageUrl) {
        expect(cell.querySelector("img")).toHaveAttribute("src", givenRowValue);
      } else if (givenRowValue && !columns[i].display) {
        expect(actualCellContent).toEqual(givenRowValue);
      } else if (givenRowValue && columns[i].display) {
        expect(actualCellContent).toEqual(columns[i].display(givenRowValue));
      } else if (!givenRowValue) {
        expect(actualCellContent).toEqual("");
      }
    });
  });

  it("fires click event", async () => {
    const { component, clickOnRow } = renderRow();

    listen(component, "click");
    await clickOnRow();
    expect(component).toHaveFiredEvent("click");
  });
});
