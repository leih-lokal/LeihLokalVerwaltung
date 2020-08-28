import "@testing-library/jest-dom/extend-expect";

import { render, fireEvent } from "@testing-library/svelte";

import Pagination from "../src/components/Table/Pagination";


function generateTestRows(number) {
  let rows = [];
  for (let i = 0; i < number; i++) {
    rows.push({
      id: i,
    });
  }
  return rows;
}

var testRows;

beforeEach(() => {
  testRows = generateTestRows(1000);
});

describe("Table Pagination", () => {
  it("should show a button for the first page", () => {
    const { getByText } = render(Pagination, {
      props: {
        rows: testRows,
      },
    });

    expect(getByText("1")).toBeInTheDocument();
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
      const WINDOW_HEIGHT = 800;
      global.innerHeight = WINDOW_HEIGHT;
      const ROWS_PER_PAGE = Math.round((WINDOW_HEIGHT - 240) / 40);

      const { container, getByText } = render(Pagination, {
        props: {
          rows: generateTestRows(pages * ROWS_PER_PAGE),
        },
      });

      for (let i = 1; i < currentPage; i++) {
        await fireEvent.click(getByText("»"));
      }

      let elements = Array.from(container.querySelectorAll("a"));

      // remove << and >> buttons
      elements.shift();
      elements.pop();

      expect(elements.map((el) => el.textContent)).toMatchObject(expectedButtons);
    }
  );

});
