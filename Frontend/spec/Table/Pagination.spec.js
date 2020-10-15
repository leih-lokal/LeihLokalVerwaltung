import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent } from "@testing-library/svelte";
import WithPagination from "../../src/components/Table/WithPagination.svelte";
import PaginationTest from "./PaginationTest.svelte";

const WINDOW_HEIGHT = 800;
const ROW_HEIGHT = 40;
const ROWS_PER_PAGE = Math.round((WINDOW_HEIGHT - 230) / ROW_HEIGHT);

const generateTestRows = (n) => [...Array(n).keys()].map((i) => ({ id: i }));

beforeAll(() => {
  global.innerHeight = WINDOW_HEIGHT;
});

describe("Table Pagination", () => {
  const renderPagination = (component, numPages) => {
    const { container, getByText } = render(component, {
      props: {
        rows: generateTestRows(numPages * ROWS_PER_PAGE),
        rowHeight: ROW_HEIGHT,
      },
    });
    return {
      button: (text) => getByText(text),
      buttons: () => Array.from(container.querySelectorAll("a")),
      clickButton: async (text) => await fireEvent.click(getByText(text)),
      rows: () => Array.from(container.querySelectorAll(".row")),
      currentPageIndicator: () => container.querySelector(".currentPage"),
    };
  };

  it("should show a button for the first page", () => {
    const { button } = renderPagination(WithPagination, 10);
    expect(button("1")).toBeInTheDocument();
  });

  test.each`
    pages | currentPage | expectedButtons
    ${0}  | ${0}        | ${["1"]}
    ${1}  | ${1}        | ${["1"]}
    ${2}  | ${1}        | ${["1", "2"]}
    ${3}  | ${1}        | ${["1", "2", "3"]}
    ${4}  | ${1}        | ${["1", "2", "3", "4"]}
    ${5}  | ${1}        | ${["1", "2", "3", "4", "5"]}
    ${6}  | ${1}        | ${["1", "2", "3", "...", "6"]}
    ${50} | ${1}        | ${["1", "2", "3", "...", "50"]}
    ${50} | ${2}        | ${["1", "2", "3", "4", "...", "50"]}
    ${50} | ${3}        | ${["1", "2", "3", "4", "5", "...", "50"]}
    ${50} | ${4}        | ${["1", "2", "3", "4", "5", "6", "...", "50"]}
    ${50} | ${5}        | ${["1", "2", "3", "4", "5", "6", "7", "...", "50"]}
    ${50} | ${6}        | ${["1", "...", "4", "5", "6", "7", "8", "...", "50"]}
    ${50} | ${45}       | ${["1", "...", "43", "44", "45", "46", "47", "...", "50"]}
    ${50} | ${46}       | ${["1", "...", "44", "45", "46", "47", "48", "49", "50"]}
    ${50} | ${47}       | ${["1", "...", "45", "46", "47", "48", "49", "50"]}
    ${50} | ${48}       | ${["1", "...", "46", "47", "48", "49", "50"]}
    ${50} | ${49}       | ${["1", "...", "47", "48", "49", "50"]}
    ${50} | ${50}       | ${["1", "...", "48", "49", "50"]}
  `(
    "should display buttons $expectedButtons for $pages pages when on page $currentPage",
    async ({ pages, currentPage, expectedButtons }) => {
      const { buttons, clickButton } = renderPagination(WithPagination, pages);

      for (let i = 1; i < currentPage; i++) {
        await clickButton("»");
      }

      let elements = buttons();

      // remove << and >> buttons
      elements.shift();
      elements.pop();

      expect(elements.map((el) => el.textContent)).toMatchObject(expectedButtons);
    }
  );

  it("should emit rows of current page", async () => {
    const NUMBER_OF_TEST_PAGES = 50;

    const { rows, clickButton, currentPageIndicator } = renderPagination(
      PaginationTest,
      NUMBER_OF_TEST_PAGES
    );

    let expectedRowsPerPage = [];
    for (let i = 0; i < NUMBER_OF_TEST_PAGES * ROWS_PER_PAGE; i += ROWS_PER_PAGE) {
      let rowsOfPage = [];
      for (let x = 0; x < ROWS_PER_PAGE; x++) {
        rowsOfPage.push(`{"id":${i + x}}`);
      }
      expectedRowsPerPage.push(rowsOfPage);
    }

    for (let i = 0; i < NUMBER_OF_TEST_PAGES; i++) {
      expect(currentPageIndicator()).toHaveTextContent(i);
      expect(rows().length).toEqual(expectedRowsPerPage[i].length);
      expect(rows().map((row) => row.textContent)).toMatchObject(expectedRowsPerPage[i]);
      await clickButton("»");
    }
  });

  it("should disable left or right button when on first or last page", async () => {
    const NUMBER_OF_TEST_PAGES = 50;

    const { clickButton, currentPageIndicator } = renderPagination(
      PaginationTest,
      NUMBER_OF_TEST_PAGES
    );

    for (let i = 0; i < NUMBER_OF_TEST_PAGES + 10; i++) await clickButton("«");
    expect(currentPageIndicator()).toHaveTextContent(0);

    for (let i = 0; i < NUMBER_OF_TEST_PAGES + 10; i++) await clickButton("»");
    expect(currentPageIndicator()).toHaveTextContent(NUMBER_OF_TEST_PAGES - 1);
  });

  it("should change the current page on button click", async () => {
    const NUMBER_OF_TEST_PAGES = 50;

    const { clickButton, currentPageIndicator } = renderPagination(
      PaginationTest,
      NUMBER_OF_TEST_PAGES
    );

    // click button for last page
    await clickButton(NUMBER_OF_TEST_PAGES + "");
    expect(currentPageIndicator()).toHaveTextContent(NUMBER_OF_TEST_PAGES - 1);

    // click button for first page
    await clickButton("1");
    expect(currentPageIndicator()).toHaveTextContent(0);

    // click button for every page
    for (let i = 1; i <= NUMBER_OF_TEST_PAGES; i++) {
      await clickButton(i + "");
      expect(currentPageIndicator()).toHaveTextContent(i - 1);
    }

    // click button for every second page
    for (let i = 1; i <= NUMBER_OF_TEST_PAGES; i += 2) {
      await clickButton(i + "");
      expect(currentPageIndicator()).toHaveTextContent(i - 1);
    }
  });
});
