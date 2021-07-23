jest.mock("../../../src/components/Table/Cell.svelte", () => {
  const html = require("svelte-htm");
  const component = html`<div>Mocked Cell</div>`;
  const mock = require("svelte-jester-mock").mockComponent(component);

  return mock;
});

import Row from "../../../src/components/Table/Row.svelte";
import Cell from "../../../src/components/Table/Cell.svelte";
import { render, fireEvent } from "@testing-library/svelte";

const getMockedComponentProps = (component) => {
  const lastCall = component.default.mock.calls.length - 1;
  return component.default.mock.calls[lastCall][0]["props"];
};

describe(Row.name, () => {
  const renderRowWithItemsAndCols = (item, cols) => {
    const cellBackgroundColorsMock = jest.fn(() => Promise.resolve([]));
    const { queryAllByText, component, container } = render(Row, {
      props: {
        columns: cols,
        item: item,
        rowHeight: 40,
        cellBackgroundColorsFunction: cellBackgroundColorsMock,
      },
    });

    return {
      clickOnRow: () => fireEvent.click(container.querySelector("tr")),
      queryAllByText,
      component,
      cellBackgroundColorsMock,
    };
  };

  it("passes item value to cell", async () => {
    renderRowWithItemsAndCols({ firstname: "firstname" }, [
      {
        title: "Vorname",
        key: "firstname",
      },
    ]);

    expect(await getMockedComponentProps(Cell)["valueFunction"]()).toEqual(
      "firstname"
    );
  });

  it("transforms value before passing it to a cell", async () => {
    renderRowWithItemsAndCols({ firstname: "firstname" }, [
      {
        title: "Vorname",
        key: "firstname",
        display: async (value) => "transformed value",
      },
    ]);
    expect(await getMockedComponentProps(Cell)["valueFunction"]()).toEqual(
      "transformed value"
    );
  });

  it("forwards prop rowHeight to cell", () => {
    renderRowWithItemsAndCols({ firstname: "firstname" }, [
      {
        title: "Vorname",
        key: "firstname",
      },
    ]);

    expect(Cell).toHaveSvelteProp("rowHeight", 40);
  });

  it("forwards isImage to cell", () => {
    renderRowWithItemsAndCols({ image: "url" }, [
      {
        title: "Bild",
        key: "image",
        isImageUrl: true,
      },
    ]);

    expect(Cell).toHaveSvelteProp("isImage", true);
  });

  it("calls cellBackgroundColorsFunction with item", async () => {
    const item = { firstname: "firstname" };
    const { cellBackgroundColorsMock } = renderRowWithItemsAndCols(item, [
      {
        title: "Vorname",
        key: "firstname",
      },
    ]);

    expect(cellBackgroundColorsMock.mock.calls.length).toBe(1);
    expect(cellBackgroundColorsMock.mock.calls[0][0]).toMatchObject(item);
  });

  it("renders a cell for each column", () => {
    const { queryAllByText } = renderRowWithItemsAndCols({}, [
      {
        title: "Vorname",
        key: "firstname",
      },
      {
        title: "Nachname",
        key: "lastname",
      },
      {
        title: "Id",
        key: "id",
      },
    ]);

    expect(queryAllByText("Mocked Cell")).toHaveLength(3);
  });

  it("does not render item prop without column", () => {
    const { queryAllByText } = renderRowWithItemsAndCols(
      { attrWithoutCol: "firstname" },
      []
    );
    expect(queryAllByText("Mocked Cell")).toHaveLength(0);
  });

  it("fires click event", async () => {
    const { component, clickOnRow } = renderRowWithItemsAndCols([], []);

    listen(component, "click");
    await clickOnRow();
    expect(component).toHaveFiredEvent("click");
  });
});
