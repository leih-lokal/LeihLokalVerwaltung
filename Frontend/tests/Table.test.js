import Table from "../src/components/Table/Table.svelte";
import { render } from "@testing-library/svelte";

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

function generateTestRows() {
  let rows = [];
  for (let i = 50; i >= 0; i--) {
    rows.push({
      _id: String(i),
      firstname: "ergehrgeg",
      lastname: "wgerge",
    });
  }
  return rows;
}

const rows = generateTestRows();
const rowsSortedById = rows.concat().sort((a, b) => {
  if (parseInt(a._id) < parseInt(b._id)) return -1;
  if (parseInt(a._id) > parseInt(b._id)) return 1;
  return 0;
});

describe("Table ", () => {
  it("renders table header", async () => {
    const { container } = render(Table, {
      props: {
        rows: rows,
        columns: columns,
      },
    });

    const displayedTableColumnHeaders = container.querySelectorAll("table > thead > tr > th");
    expect(displayedTableColumnHeaders.length).toEqual(columns.length);

    displayedTableColumnHeaders.forEach((th, idx) => {
      expect(th).toHaveTextContent(columns[idx].title);
    });
  });
  /**
  it("renders table body", async () => {
    const { container } = render(Table, {
      props: {
        rows: rows,
        columns: columns,
      },
    });

    const displayedTableRows = container.getElementsByTagName("svelte-virtual-list-row");
    expect(displayedTableRows.length).toEqual(rows.length);

    displayedTableRows.forEach((displayedRow, idx) => {
      let expectedRowData = [];
      Object.values(columns).forEach((column) =>
        expectedRowData.push(rowsSortedById[idx][column.key])
      );
      console.log(expectedRowData);
      displayedRow.querySelectorAll("td").forEach((displayedCell, idx2) => {
        expect(displayedCell).toHaveTextContent(expectedRowData[idx2]);
        console.log(idx2);
      });
    });
  });*/
});
