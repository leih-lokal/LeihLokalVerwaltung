import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import SearchFilterBarTest from "./SearchFilterBarTest.svelte";

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
  const renderSearchBox = async (currentPage = 0, searchText) => {
    const { container } = render(SearchFilterBarTest, {
      props: {
        preprocessedRows: rows,
        columns: columns,
        currentPage: currentPage,
      },
    });

    const input = container.querySelector(".searchInput");

    const searchFor = async (text) => {
      await userEvent.type(input, "{selectall}{del}");
      await userEvent.type(input, text);
    };

    if (searchText) await searchFor(searchText);

    return {
      tableRows: () => Array.from(container.querySelectorAll(".row")),
      searchFor: searchFor,
      currentPageIndicator: () => container.querySelector(".currentPage"),
    };
  };

  it("should not filter rows on initial render", async () => {
    const { tableRows } = await renderSearchBox();
    expect(tableRows().length).toEqual(rows.length);
  });

  it("should not filter rows for empty search term", async () => {
    const { tableRows } = await renderSearchBox(0, "");
    expect(tableRows().length).toEqual(rows.length);
  });

  it("should filter values by not existing search term", async () => {
    const { tableRows } = await renderSearchBox(0, "text not contained in any value");
    expect(tableRows().length).toEqual(0);
  });

  it("should filter values by search term contained in row2", async () => {
    const { tableRows } = await renderSearchBox(0, "row2");
    expect(tableRows().length).toEqual(1);
    expect(tableRows()[0]).toHaveTextContent("row2_value1");
    expect(tableRows()[0]).toHaveTextContent("row2_value2");
    expect(tableRows()[0]).toHaveTextContent("row2_value3");
  });

  it("should filter values by search term contained in all rows", async () => {
    const { tableRows } = await renderSearchBox(0, "value1");
    expect(tableRows().length).toEqual(3);
    expect(tableRows()[0]).toHaveTextContent("row1_value1");
    expect(tableRows()[1]).toHaveTextContent("row2_value1");
    expect(tableRows()[2]).toHaveTextContent("row3_value1");
  });

  it("should remove filter when deleting search term", async () => {
    const { searchFor, tableRows } = await renderSearchBox();

    await searchFor("text not contained in any value");
    expect(tableRows().length).toEqual(0);

    await searchFor("");
    expect(tableRows().length).toEqual(rows.length);
  });

  it("should filter values by search term consisting of multiple values", async () => {
    const { tableRows } = await renderSearchBox(0, "row2_value2 row2_value1");
    expect(tableRows().length).toEqual(1);
    expect(tableRows()[0]).toHaveTextContent("row2_value1");
    expect(tableRows()[0]).toHaveTextContent("row2_value2");
    expect(tableRows()[0]).toHaveTextContent("row2_value3");
  });

  it("should set currentPage to 0 when searching", async () => {
    const { searchFor, currentPageIndicator } = await renderSearchBox(1);

    expect(currentPageIndicator()).toHaveTextContent("1");
    await searchFor("row");
    expect(currentPageIndicator()).toHaveTextContent("0");
  });

  it("should search column from beginning", async () => {
    const { searchFor, tableRows } = await renderSearchBox();

    await searchFor("value4");
    expect(tableRows().length).toEqual(0);

    await searchFor("from_beginning_");
    expect(tableRows().length).toEqual(3);
  });

  it("should exclude column as defined in columns", async () => {
    const { tableRows } = await renderSearchBox(0, "value5");
    expect(tableRows().length).toEqual(0);
  });

  it("should exclude column not contained in columns", async () => {
    const { tableRows } = await renderSearchBox(0, "value6");
    expect(tableRows().length).toEqual(0);
  });
});
