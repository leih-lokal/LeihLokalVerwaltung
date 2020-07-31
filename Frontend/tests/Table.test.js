import Table from "../src/components/Table/Table.svelte";
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

const rows = [
  {
    _id: "id",
    lastname: "lastname",
    firstname: "firstname",
  },
];

describe("Table ", () => {
  it("renders table header", async () => {
    const { container } = render(Table, {
      props: {
        rows: rows,
        columns: columns,
      },
    });

    container.querySelectorAll("table > thead > tr").forEach((th, idx) => {
      expect(th).toHaveTextContent(columns[idx].title);
    });
  });
});
