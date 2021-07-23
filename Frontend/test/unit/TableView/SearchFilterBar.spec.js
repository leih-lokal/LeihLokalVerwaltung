import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";
import SearchFilterBar from "../../../src/components/TableView/SearchFilterBar.svelte";
import userEvent from "@testing-library/user-event";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe("SearchFilterBar", () => {
  const renderSearchFilterBar = () => {
    const filterOptions = ["value1", "value2", "value3"];
    const searchTermStore = writable("");
    const { container } = render(
      html`<${SearchFilterBar}
        filterOptions=${filterOptions}
        bind:searchTerm=${searchTermStore}
      />`
    );
    return {
      searchInput: container.querySelector(".searchInput"),
      searchTermStore: searchTermStore,
    };
  };

  it("updates searchTerm after debounce", async () => {
    const { searchTermStore, searchInput } = renderSearchFilterBar();
    await userEvent.type(searchInput, "abc");
    expect(get(searchTermStore)).toEqual("");
    await sleep(800);
    expect(get(searchTermStore)).toEqual("abc");
  });
});
