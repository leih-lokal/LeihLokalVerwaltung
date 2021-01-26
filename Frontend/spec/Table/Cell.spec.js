import Cell from "../../src/components/Table/Cell.svelte";
import { render } from "@testing-library/svelte";

describe(Cell.name, () => {
  const renderCellWithProps = (props) => {
    const { component, container } = render(Cell, {
      props: props,
    });

    return {
      divStyle: !props.isImage
        ? window.getComputedStyle(container.querySelector(".cell"))
        : undefined,
      tdStyle: window.getComputedStyle(container.querySelector("td")),
      container,
      component,
    };
  };

  it("displays given text", () => {
    const { container } = renderCellWithProps({ value: "value" });
    expect(container.querySelector(".cell")).toHaveTextContent("value");
  });

  it("displays given image", () => {
    const { container } = renderCellWithProps({ isImage: true, value: "url" });
    expect(container.querySelector("img")).toHaveAttribute("src", "url");
  });

  it("does not display image without url", () => {
    const { container } = renderCellWithProps({ isImage: true, value: "" });
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("applies rowHeight", () => {
    const { divStyle, tdStyle } = renderCellWithProps({ rowHeight: 10 });
    expect(divStyle["max-height"]).toBe("10px");
    expect(tdStyle["height"]).toBe("10px");
  });

  it("applies backgroundColor", () => {
    const { tdStyle } = renderCellWithProps({ backgroundColor: "green" });
    expect(tdStyle["background-color"]).toBe("green");
  });

  it("uses white font for dark rgb background-color", () => {
    const { tdStyle } = renderCellWithProps({ backgroundColor: "rgb(0,0, 0)" });
    expect(tdStyle["color"]).toBe("white");
  });

  it("uses white font for dark hex background-color", () => {
    const { tdStyle } = renderCellWithProps({ backgroundColor: "#000000" });
    expect(tdStyle["color"]).toBe("white");
  });

  it("uses black font for bright background-color", () => {
    const { tdStyle } = renderCellWithProps({ backgroundColor: "#ffffff" });
    expect(tdStyle["color"]).toBe("black");
  });
});
