import Cell from "../../../src/components/Table/Cell.svelte";
import { render } from "@testing-library/svelte";

describe(Cell.name, () => {
  const renderCellWithProps = async (props) => {
    const { component, container } = render(Cell, {
      props: props,
    });

    // wait for cell to render
    await new Promise(setTimeout);

    return {
      divStyle: !props.isImage
        ? window.getComputedStyle(container.querySelector(".cell"))
        : undefined,
      tdStyle: window.getComputedStyle(container.querySelector("td")),
      container,
      component,
    };
  };

  it("displays given text", async () => {
    const { container } = await renderCellWithProps({ valueFunction: async () => "value" });
    expect(container.querySelector(".cell")).toHaveTextContent("value");
  });

  it("displays given image", async () => {
    const { container } = await renderCellWithProps({
      isImage: true,
      valueFunction: async () => "url",
    });
    expect(container.querySelector("img")).toHaveAttribute("src", "url");
  });

  it("does not display image without url", async () => {
    const { container } = await renderCellWithProps({
      isImage: true,
      valueFunction: async () => "",
    });
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("applies rowHeight", async () => {
    const { divStyle, tdStyle } = await renderCellWithProps({ rowHeight: 10 });
    expect(divStyle["max-height"]).toBe("10px");
    expect(tdStyle["height"]).toBe("10px");
  });

  it("applies backgroundColor", async () => {
    const { tdStyle } = await renderCellWithProps({ backgroundColor: "green" });
    expect(tdStyle["background-color"]).toBe("green");
  });

  it("uses white font for dark rgb background-color", async () => {
    const { tdStyle } = await renderCellWithProps({ backgroundColor: "rgb(0,0, 0)" });
    expect(tdStyle["color"]).toBe("white");
  });

  it("uses white font for dark hex background-color", async () => {
    const { tdStyle } = await renderCellWithProps({ backgroundColor: "#000000" });
    expect(tdStyle["color"]).toBe("white");
  });

  it("uses black font for bright background-color", async () => {
    const { tdStyle } = await renderCellWithProps({ backgroundColor: "#ffffff" });
    expect(tdStyle["color"]).toBe("black");
  });
});
