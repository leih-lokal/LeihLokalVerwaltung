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

    it("fires an event when clicking on a header", async () => {
        const { component, getByText } = render(TableHeader, {
            props: {
                columns: columns,
            },
        });

        listen(component, 'columnHeaderClicked')
        await fireEvent.click(getByText("Id"));
        expect(component).toHaveFiredEvent('columnHeaderClicked');
    })

    it("fires an event containing a count of clicks", async () => {
        const { component, getByText } = render(TableHeader, {
            props: {
                columns: columns,
            },
        });

        listen(component, 'columnHeaderClicked')

        await fireEvent.click(getByText("Id"));
        expect(component).toHaveFiredEventWith('columnHeaderClicked', {
            key: "_id",
            sameColumnKeyClickCount: 2,
        })

        await fireEvent.click(getByText("Id"));
        expect(component).toHaveFiredEventWith('columnHeaderClicked', {
            key: "_id",
            sameColumnKeyClickCount: 3,
        })

        await fireEvent.click(getByText("Nachname"));
        expect(component).toHaveFiredEventWith('columnHeaderClicked', {
            key: "lastname",
            sameColumnKeyClickCount: 1,
        })

        await fireEvent.click(getByText("Nachname"));
        expect(component).toHaveFiredEventWith('columnHeaderClicked', {
            key: "lastname",
            sameColumnKeyClickCount: 2,
        })
    })

});