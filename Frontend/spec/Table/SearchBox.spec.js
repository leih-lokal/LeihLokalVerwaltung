import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import SearchBoxTest from "./SearchBoxTest.svelte";

const rows = [
  {
    column1: "row1_value1",
    column2: "row1_value2",
    column3: "row1_value3",
    column4: "from_beginning_row1_value4",
    column5: "row1_value5",
    column6: "row1_value6",
  },
  {
    column1: "row2_value1",
    column2: "row2_value2",
    column3: "row2_value3",
    column4: "from_beginning_row2_value4",
    column5: "row2_value5",
    column6: "row2_value6",
  },
  {
    column1: "row3_value1",
    column2: "row3_value2",
    column3: "row3_value3",
    column4: "from_beginning_row3_value4",
    column5: "row3_value5",
    column6: "row3_value6",
  },
];

const columns = [
  {
    key: "column1",
  },
  {
    key: "column2",
  },
  {
    key: "column3",
  },
  {
    key: "column4",
    search: "from_beginning",
  },
  {
    key: "column5",
    search: "exclude",
  },
];

describe("Table Searchbox", () => {
  const renderSearchBox = async () => {
    return render(SearchBoxTest, {
      props: {
        preprocessedRows: rows,
        columns: columns,
      },
    });
  };

  const searchFor = async (searchText, container, getByRole) => {
    const input = getByRole("textbox");

    await userEvent.type(input, "{selectall}{del}");
    await userEvent.type(input, searchText);
    return Array.from(container.querySelectorAll(".row"));
  };

  const renderAndSearch = async (searchText) => {
    const { container, getByRole } = await renderSearchBox();
    return await searchFor(searchText, container, getByRole);
  };

  it("should not filter rows on initial render", () => {
    const { container } = render(SearchBoxTest, {
      props: {
        preprocessedRows: rows,
        columns: columns,
      },
    });

    let elements = Array.from(container.querySelectorAll(".row"));
    expect(elements.length).toEqual(rows.length);
  });

  it("should not filter rows for empty search term", async () => {
    const tableRows = await renderAndSearch("");
    expect(tableRows.length).toEqual(rows.length);
  });

  it("should filter values by not existing search term", async () => {
    const tableRows = await renderAndSearch("text not contained in any value");
    expect(tableRows.length).toEqual(0);
  });

  it("should filter values by search term contained in row2", async () => {
    const tableRows = await renderAndSearch("row2");
    expect(tableRows.length).toEqual(1);
    expect(tableRows[0]).toHaveTextContent("row2_value1");
    expect(tableRows[0]).toHaveTextContent("row2_value2");
    expect(tableRows[0]).toHaveTextContent("row2_value3");
  });

  it("should filter values by search term contained in all rows", async () => {
    const tableRows = await renderAndSearch("value1");
    expect(tableRows.length).toEqual(3);
    expect(tableRows[0]).toHaveTextContent("row1_value1");
    expect(tableRows[1]).toHaveTextContent("row2_value1");
    expect(tableRows[2]).toHaveTextContent("row3_value1");
  });

  it("should remove filter when deleting search term", async () => {
    const { container, getByRole } = await renderSearchBox();

    let tableRows = await searchFor("text not contained in any value", container, getByRole);
    expect(tableRows.length).toEqual(0);

    tableRows = await searchFor("", container, getByRole);
    expect(tableRows.length).toEqual(rows.length);
  });

  it("should filter values by search term consisting of multiple values", async () => {
    const tableRows = await renderAndSearch("row2_value2 row2_value1");
    expect(tableRows.length).toEqual(1);
    expect(tableRows[0]).toHaveTextContent("row2_value1");
    expect(tableRows[0]).toHaveTextContent("row2_value2");
    expect(tableRows[0]).toHaveTextContent("row2_value3");
  });

  it("should set currentPage to 0 when searching", async () => {
    const { container, getByRole } = render(SearchBoxTest, {
      props: {
        preprocessedRows: rows,
        currentPage: 1,
        columns: columns,
      },
    });

    expect(container.querySelector(".currentPage")).toHaveTextContent("1");
    await searchFor("row", container, getByRole);
    expect(container.querySelector(".currentPage")).toHaveTextContent("0");
  });

  it("should search column from beginning", async () => {
    const { container, getByRole } = await renderSearchBox();

    let tableRows = await searchFor("value4", container, getByRole);
    expect(tableRows.length).toEqual(0);

    tableRows = await searchFor("from_beginning_", container, getByRole);
    expect(tableRows.length).toEqual(3);
  });

  it("should exclude column as defined in columns", async () => {
    const tableRows = await renderAndSearch("value5");
    expect(tableRows.length).toEqual(0);
  });

  it("should exclude column not contained in columns", async () => {
    const tableRows = await renderAndSearch("value6");
    expect(tableRows.length).toEqual(0);
  });
});
