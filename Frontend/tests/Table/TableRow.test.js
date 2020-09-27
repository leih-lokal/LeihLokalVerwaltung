import TableRow from "../../src/components/Table/TableRow.svelte";
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

const item = {
    _id: 0,
    firstname: "pljrtbr",
    lastname: "sdvbtrr"
};

describe("TableRow", () => {

    it("displays a value for each column", () => {
        const { container } = render(TableRow, {
            props: {
                columns: columns,
                item: item
            },
        });

        const valueElements = container.querySelectorAll("tr > td");
        expect(valueElements.length).toEqual(columns.length);
        valueElements.forEach((valueElement, i) => {
            expect(valueElement).toHaveTextContent(item[columns[i].key]);
        });
    });

    it("fires click event", async () => {
        const { component, container } = render(TableRow, {
            props: {
                columns: columns,
                item: item
            },
        });

        listen(component, "click");
        await fireEvent.click(container.querySelector("tr"));
        expect(component).toHaveFiredEvent('click');
    })

});