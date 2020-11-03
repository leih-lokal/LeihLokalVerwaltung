import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import SearchFilterBar from "../../src/components/Table/SearchFilterBar.svelte";
import userEvent from "@testing-library/user-event";

describe("SearchFilterBar", () => {
  const renderSearchFilterBar = (callback) => {
    const { container } = render(SearchFilterBar, {
      props: {
        onFilterOrSearchTermChange: callback,
      },
    });
    return {
      searchInput: container.querySelector(".searchInput"),
    };
  };

  it("calls callback on search input", async () => {
    const mockCallback = jest.fn((filters, searchTerm) => {});
    const { searchInput } = renderSearchFilterBar(mockCallback);
    await userEvent.type(searchInput, "abc");
    expect(mockCallback.mock.calls.length).toBe(3);
    expect(mockCallback.mock.calls[0][1]).toBe("a");
    expect(mockCallback.mock.calls[1][1]).toBe("ab");
    expect(mockCallback.mock.calls[2][1]).toBe("abc");
  });
});
