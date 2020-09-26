import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import userEvent from '@testing-library/user-event';
import SearchBoxTest from "SearchBoxTest";

const rows = [
    {
        "column1": "row1_value1",
        "column2": "row1_value2",
        "column3": "row1_value3",
    },
    {
        "column1": "row2_value1",
        "column2": "row2_value2",
        "column3": "row2_value3",
    },
    {
        "column1": "row3_value1",
        "column2": "row3_value2",
        "column3": "row3_value3",
    }
];

describe("Table Searchbox", () => {

    it("should not filter rows on initial render", () => {
        const { container } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(rows.length);
    });

    it("should not filter rows for empty search term", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');
        await userEvent.type(input, '');
        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(rows.length);
    });

    it("should filter values by not existing search term", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');
        await userEvent.type(input, 'text not contained in any value');

        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(0);
    });

    it("should filter values by search term contained in row2", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');
        await userEvent.type(input, 'row2');

        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(1);
        expect(elements[0]).toHaveTextContent("row2_value1");
        expect(elements[0]).toHaveTextContent("row2_value2");
        expect(elements[0]).toHaveTextContent("row2_value3");
    });

    it("should filter values by search term contained in all rows", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');
        await userEvent.type(input, 'value1');

        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(3);
        expect(elements[0]).toHaveTextContent("row1_value1");
        expect(elements[1]).toHaveTextContent("row2_value1");
        expect(elements[2]).toHaveTextContent("row3_value1");
    });

    it("should remove filter when deleting search term", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');

        await userEvent.type(input, 'text not contained in any value');
        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(0);

        await userEvent.type(input, '{selectall}{del}');
        elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(rows.length);
    });

    it("should filter values by search term consisting of multiple values", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows
            },
        });

        const input = getByRole('textbox');
        await userEvent.type(input, 'row2_value2 row2_value1');

        let elements = Array.from(container.querySelectorAll(".row"));
        expect(elements.length).toEqual(1);
        expect(elements[0]).toHaveTextContent("row2_value1");
        expect(elements[0]).toHaveTextContent("row2_value2");
        expect(elements[0]).toHaveTextContent("row2_value3");
    });

    it("should set currentPage to 0 when searching", async () => {
        const { container, getByRole } = render(SearchBoxTest, {
            props: {
                preprocessedRows: rows,
                currentPage: 1
            },
        });

        expect(container.querySelector(".currentPage")).toHaveTextContent("1");

        const input = getByRole('textbox');
        await userEvent.type(input, 'row');

        expect(container.querySelector(".currentPage")).toHaveTextContent("0");
    });

});