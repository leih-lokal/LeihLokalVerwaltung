import Header from "../../../src/components/Table/Header.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import html from "svelte-htm";

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

const indicateSort = ["", "up", "down"];

describe(Header.name, () => {
  const renderHeader = () => {
    const onColHeaderClickedMock = jest.fn();
    const { container, component } = render(
      html`<${Header}
        columns=${columns}
        indicateSort=${indicateSort}
        on:colHeaderClicked=${onColHeaderClickedMock}
      />`
    );
    return {
      columnTitles: container.querySelectorAll("th"),
      onColHeaderClickedMock: onColHeaderClickedMock,
      component: component,
    };
  };

  const expectIndicatesSort = (columnTitles) => {
    columnTitles.forEach((titleElement, i) => {
      if (indicateSort[i] == "up") {
        expect(titleElement.querySelector(".sort-indicator-down")).not.toBeVisible();
        expect(titleElement.querySelector(".sort-indicator-up")).toBeVisible();
      } else if (indicateSort[i] == "down") {
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

  it("displays sort indicators", () => {
    const { columnTitles } = renderHeader();
    expectIndicatesSort(columnTitles);
  });

  it("fires onColHeaderClicked event", async () => {
    const { columnTitles, onColHeaderClickedMock, component } = renderHeader();
    await fireEvent.click(columnTitles[0]);
    expect(onColHeaderClickedMock).toHaveBeenCalledTimes(1);
    await fireEvent.click(columnTitles[1]);
    expect(onColHeaderClickedMock).toHaveBeenCalledTimes(2);
    await fireEvent.click(columnTitles[2]);
    expect(onColHeaderClickedMock).toHaveBeenCalledTimes(3);
  });
});
