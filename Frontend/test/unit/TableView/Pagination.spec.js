import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent } from "@testing-library/svelte";
import Pagination from "../../../src/components/TableView/Pagination.svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";

describe("Table Pagination", () => {
  const renderPagination = async (numberOfPages, currentPage = 0) => {
    const numberOfPagesPromise = Promise.resolve(numberOfPages);
    const currentPageStore = writable(currentPage);
    const { container, getByText } = render(
      html`<${Pagination}
        bind:currentPage=${currentPageStore}
        numberOfPagesPromise=${numberOfPagesPromise}
      />`
    );
    await numberOfPagesPromise;
    return {
      buttonWithText: (text) => getByText(text),
      buttons: Array.from(container.querySelectorAll("a")),
      clickButton: (text) => fireEvent.click(getByText(text)),
      currentPageStore: currentPageStore,
    };
  };

  test.each`
    pages | currentPage | expectedButtons
    ${0}  | ${0}        | ${[]}
    ${1}  | ${0}        | ${[]}
    ${2}  | ${0}        | ${["1", "2"]}
    ${3}  | ${0}        | ${["1", "2", "3"]}
    ${4}  | ${0}        | ${["1", "2", "3", "4"]}
    ${5}  | ${0}        | ${["1", "2", "3", "4", "5"]}
    ${6}  | ${0}        | ${["1", "2", "3", "...", "6"]}
    ${50} | ${0}        | ${["1", "2", "3", "...", "50"]}
    ${50} | ${1}        | ${["1", "2", "3", "4", "...", "50"]}
    ${50} | ${2}        | ${["1", "2", "3", "4", "5", "...", "50"]}
    ${50} | ${3}        | ${["1", "2", "3", "4", "5", "6", "...", "50"]}
    ${50} | ${4}        | ${["1", "2", "3", "4", "5", "6", "7", "...", "50"]}
    ${50} | ${5}        | ${["1", "...", "4", "5", "6", "7", "8", "...", "50"]}
    ${50} | ${44}       | ${["1", "...", "43", "44", "45", "46", "47", "...", "50"]}
    ${50} | ${45}       | ${["1", "...", "44", "45", "46", "47", "48", "49", "50"]}
    ${50} | ${46}       | ${["1", "...", "45", "46", "47", "48", "49", "50"]}
    ${50} | ${47}       | ${["1", "...", "46", "47", "48", "49", "50"]}
    ${50} | ${48}       | ${["1", "...", "47", "48", "49", "50"]}
    ${50} | ${49}       | ${["1", "...", "48", "49", "50"]}
  `(
    "displays buttons $expectedButtons for $pages pages when on page $currentPage",
    async ({ pages, currentPage, expectedButtons }) => {
      const { buttons } = await renderPagination(pages, currentPage);
      if (pages <= 1) {
        expect(buttons.map((el) => el.textContent)).toMatchObject([]);
      } else {
        expect(buttons.map((el) => el.textContent)).toMatchObject([
          "«",
          ...expectedButtons,
          "»",
        ]);
      }
    }
  );

  it("should disable left or right button when on first or last page", async () => {
    const NUMBER_OF_TEST_PAGES = 50;
    const { clickButton, currentPageStore } = await renderPagination(
      NUMBER_OF_TEST_PAGES
    );

    for (let i = 0; i < NUMBER_OF_TEST_PAGES + 10; i++) await clickButton("«");
    expect(get(currentPageStore)).toBe(0);

    for (let i = 0; i < NUMBER_OF_TEST_PAGES + 10; i++) await clickButton("»");
    expect(get(currentPageStore)).toBe(NUMBER_OF_TEST_PAGES - 1);
  });

  it("should change current page on arrow click", async () => {
    const NUMBER_OF_TEST_PAGES = 50;
    const { clickButton, currentPageStore } = await renderPagination(
      NUMBER_OF_TEST_PAGES
    );

    expect(get(currentPageStore)).toBe(0);
    await clickButton("»");
    expect(get(currentPageStore)).toBe(1);
    await clickButton("«");
    expect(get(currentPageStore)).toBe(0);
  });

  it("should change current page on button click", async () => {
    const NUMBER_OF_TEST_PAGES = 50;

    const { clickButton, currentPageStore } = await renderPagination(
      NUMBER_OF_TEST_PAGES
    );

    // click button for last page
    await clickButton(NUMBER_OF_TEST_PAGES + "");
    expect(get(currentPageStore)).toBe(NUMBER_OF_TEST_PAGES - 1);

    // click button for first page
    await clickButton("1");
    expect(get(currentPageStore)).toBe(0);

    // click button for every page
    for (let i = 1; i <= NUMBER_OF_TEST_PAGES; i++) {
      await clickButton(i + "");
      expect(get(currentPageStore)).toBe(i - 1);
    }

    // click button for every second page
    for (let i = 1; i <= NUMBER_OF_TEST_PAGES; i += 2) {
      await clickButton(i + "");
      expect(get(currentPageStore)).toBe(i - 1);
    }
  });
});
