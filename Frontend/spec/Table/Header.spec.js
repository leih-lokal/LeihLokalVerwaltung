import Header from "../../src/components/Table/Header.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";

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

describe(Header.name, () => {
  const renderHeader = (sortBy = "_id") => {
    const sortByStore = writable(sortBy);
    const sortReverseStore = writable(false);
    const { container } = render(
      html`<${Header}
        bind:sortBy=${sortByStore}
        bind:sortReverse=${sortReverseStore}
        columns=${columns}
      />`
    );
    return {
      columnTitles: container.querySelectorAll("th"),
      sortByStore: sortByStore,
      sortReverseStore: sortReverseStore,
    };
  };

  const expectIndicatesSortBy = (columnId, columnTitles, reverse = false) => {
    columnTitles.forEach((titleElement, i) => {
      if (i === columnId && reverse) {
        expect(titleElement.querySelector(".sort-indicator-down")).not.toBeVisible();
        expect(titleElement.querySelector(".sort-indicator-up")).toBeVisible();
      } else if (i === columnId && !reverse) {
        expect(titleElement.querySelector(".sort-indicator-down")).toBeVisible();
        expect(titleElement.querySelector(".sort-indicator-up")).not.toBeVisible();
      } else {
        expect(titleElement.querySelector(".sort-indicator-down")).not.toBeVisible();
        expect(titleElement.querySelector(".sort-indicator-up")).not.toBeVisible();
      }
    });
  };

  it("renders all column titles", () => {
    const { columnTitles } = renderHeader();
    expect(columnTitles.length).toEqual(columns.length);
    columnTitles.forEach((titleElement, i) => {
      expect(titleElement.textContent.trim()).toEqual(columns[i].title);
    });
  });

  it("sorts by column on title click", async () => {
    const { columnTitles, sortByStore } = renderHeader();
    expect(get(sortByStore)).toBe("_id");
    expectIndicatesSortBy(0, columnTitles, false);

    await fireEvent.click(columnTitles[1]);
    expect(get(sortByStore)).toBe(columns[1].key);
    expectIndicatesSortBy(1, columnTitles, false);

    await fireEvent.click(columnTitles[2]);
    expect(get(sortByStore)).toBe(columns[2].key);
    expectIndicatesSortBy(2, columnTitles, false);
  });

  it("sorts reverse on second click on same column", async () => {
    const { columnTitles, sortByStore, sortReverseStore } = renderHeader();

    const clickOnColumnAndExpectSorted = async (i, reverse = false) => {
      await fireEvent.click(columnTitles[i]);
      expect(get(sortByStore)).toBe(columns[i].key);
      expect(get(sortReverseStore)).toBe(reverse);
      expectIndicatesSortBy(i, columnTitles, reverse);
    };

    expect(get(sortByStore)).toBe("_id");
    expect(get(sortReverseStore)).toBe(false);
    expectIndicatesSortBy(0, columnTitles, false);

    await clickOnColumnAndExpectSorted(0, true);
    await clickOnColumnAndExpectSorted(0, false);

    await clickOnColumnAndExpectSorted(1, false);
    await clickOnColumnAndExpectSorted(1, true);
    await clickOnColumnAndExpectSorted(1, false);
    await clickOnColumnAndExpectSorted(1, true);

    await clickOnColumnAndExpectSorted(0, false);
  });
});
