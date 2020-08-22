import TableHeader from "../src/components/Table/TableHeader.svelte";
import { render, fireEvent } from "@testing-library/svelte";

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

describe("TableHeader", () => {

    it("renders all column headers", () => {
        const { container } = render(TableHeader, {
            props: {
                columns: columns,
            },
        });

        const columnHeaderElements = container.querySelectorAll("table > thead > tr > th");
        expect(columnHeaderElements.length).toEqual(columns.length);
        columnHeaderElements.forEach((headerElement, i) => {
            expect(headerElement).toHaveTextContent(columns[i].title);
        });
    });

});