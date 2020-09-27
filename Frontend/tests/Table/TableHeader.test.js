import TableHeader from "../../src/components/Table/TableHeader.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import TableHeaderTest from "./TableHeaderTest";

const columns = [
    {
        title: "Id",
        key: "_id",
    },
    {
        title: "Nachname",
        key: "lastname"
    },
    {
        title: "Vorname",
        key: "firstname"
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
        key: "lastname"
    },
    {
        title: "Vorname",
        key: "firstname"
    },
];

const rows = [
    {
        "id": "2",
        "lastname": "GHI",
        "firstname": "ABC"
    },
    {
        "id": "3",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "1",
        "lastname": "ABC",
        "firstname": "GHI"
    },
    {
        "id": "4",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "5",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "6",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "7",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "8",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "9",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "10",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "11",
        "lastname": "DEF",
        "firstname": "DEF"
    },
    {
        "id": "12",
        "lastname": "DEF",
        "firstname": "DEF"
    }
];

function expectSortedByColumnKey(actualRows, columnKey, invert = false) {
    const expectedRows = rows
        .sort((a, b) => (a[columnKey] > b[columnKey]) ? (invert ? -1 : 1) : ((b[columnKey] > a[columnKey]) ? (invert ? 1 : -1) : 0))
        .map((row) => JSON.stringify(row));
    expect(actualRows.map((row) => row.textContent)).toMatchObject(expectedRows);
}

describe("TableHeader", () => {

    it("renders all column headers", () => {
        const { container } = render(TableHeader, {
            props: {
                columns: columns,
            },
        });

        const columnHeaderElements = container.querySelectorAll("thead > tr > th");
        expect(columnHeaderElements.length).toEqual(columns.length);
        columnHeaderElements.forEach((headerElement, i) => {
            expect(headerElement).toHaveTextContent(columns[i].title);
        });
    });

    it("sorts all rows by id on initial render", () => {
        const { container } = render(TableHeaderTest, {
            props: {
                columns: columns,
                rows: rows
            },
        });

        const actualRows = Array.from(container.querySelectorAll(".row"));
        expectSortedByColumnKey(actualRows, "_id");
    });

    it("sorts all rows by column on click", async () => {
        const { container, getByText } = render(TableHeaderTest, {
            props: {
                columns: columns,
                rows: rows
            },
        });

        await fireEvent.click(getByText("Nachname"));
        let actualRows = Array.from(container.querySelectorAll(".row"));
        expectSortedByColumnKey(actualRows, "lastname");

        await fireEvent.click(getByText("Vorname"));
        actualRows = Array.from(container.querySelectorAll(".row"));
        expectSortedByColumnKey(actualRows, "firstname");

        await fireEvent.click(getByText("Id"));
        actualRows = Array.from(container.querySelectorAll(".row"));
        expectSortedByColumnKey(actualRows, "_id");
    });

    it("inverts order of rows on click", async () => {
        const { container, getByText } = render(TableHeaderTest, {
            props: {
                columns: columns,
                rows: rows
            },
        });

        for (let i = 0; i < 10; i++) {
            let actualRows = Array.from(container.querySelectorAll(".row"));
            expectSortedByColumnKey(actualRows, "_id", i % 2 !== 0);
            await fireEvent.click(getByText("Id"));
        }

        await fireEvent.click(getByText("Vorname"));
        for (let i = 0; i < 10; i++) {
            let actualRows = Array.from(container.querySelectorAll(".row"));
            expectSortedByColumnKey(actualRows, "firstname", i % 2 !== 0);
            await fireEvent.click(getByText("Vorname"));
        }

        await fireEvent.click(getByText("Nachname"));
        for (let i = 0; i < 10; i++) {
            let actualRows = Array.from(container.querySelectorAll(".row"));
            expectSortedByColumnKey(actualRows, "lastname", i % 2 !== 0);
            await fireEvent.click(getByText("Nachname"));
        }

        await fireEvent.click(getByText("Id"));
        await fireEvent.click(getByText("Id"));
        await fireEvent.click(getByText("Nachname"));
        expectSortedByColumnKey(Array.from(container.querySelectorAll(".row")), "lastname");
        await fireEvent.click(getByText("Id"));
        expectSortedByColumnKey(Array.from(container.querySelectorAll(".row")), "_id");
    });

    it("applies sort function", () => {
        const { container } = render(TableHeaderTest, {
            props: {
                columns: columnsWithSortFunction,
                rows: rows
            },
        });

        const expectedRows = rows
            .sort((a, b) => (parseInt(a._id) > parseInt(b._id)) ? 1 : ((parseInt(b._id) > parseInt(a._id)) ? -1 : 0))
            .map((row) => JSON.stringify(row));
        const actualRows = Array.from(container.querySelectorAll(".row")).map((row) => row.textContent);
        expect(actualRows).toMatchObject(expectedRows);
    })

});