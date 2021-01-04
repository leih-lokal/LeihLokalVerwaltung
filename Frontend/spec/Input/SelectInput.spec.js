import SelectInput from "../../src/components/Input/SelectInput";
import { render, fireEvent } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";

const renderSelectInputWithValueAndOptions = (value, options = []) => {
  const selectedValuesStringStore = writable();
  selectedValuesStringStore.set(value);
  const { container } = render(
    html`<${SelectInput}
      bind:selectedValuesString=${selectedValuesStringStore}
      selectionOptions=${options}
    />`
  );
  return {
    selectedValuesStringStore: selectedValuesStringStore,
    container: container,
  };
};

describe("SelectInput", () => {
  it("displays given single value", () => {
    const { container } = renderSelectInputWithValueAndOptions("value1");
    const selectItemLabels = container.querySelectorAll(".multiSelectItem_label");
    expect(selectItemLabels.length).toEqual(1);
    expect(container.querySelectorAll(".multiSelectItem_label")[0].textContent).toEqual("value1");
  });

  it("displays given multiple values", () => {
    const { container } = renderSelectInputWithValueAndOptions("value1, value2, value3");
    expect(container.querySelectorAll(".multiSelectItem_label")[0].textContent).toEqual("value1");
    expect(container.querySelectorAll(".multiSelectItem_label")[1].textContent).toEqual("value2");
    expect(container.querySelectorAll(".multiSelectItem_label")[2].textContent).toEqual("value3");
  });

  it("displays given options", async () => {
    const options = ["value1", "value2", "value3"];
    const { container } = renderSelectInputWithValueAndOptions("", options);
    await fireEvent.click(container.querySelector("input"));
    const displayedOptions = container.querySelectorAll(".listContainer .listItem .item");
    expect(displayedOptions.length).toEqual(options.length);
    options.forEach((option, i) => expect(displayedOptions[i].textContent).toEqual(option));
  });

  it("displays given options with labels", async () => {
    const options = [
      { value: "value1", label: "label1" },
      { value: "value2", label: "label2" },
      { value: "value3", label: "label3" },
    ];
    const { container } = renderSelectInputWithValueAndOptions("", options);
    await fireEvent.click(container.querySelector("input"));
    const displayedOptions = container.querySelectorAll(".listContainer .listItem .item");
    expect(displayedOptions.length).toEqual(options.length);
    options.forEach((option, i) => expect(displayedOptions[i].textContent).toEqual(option.label));
  });

  it("updates selectedValuesString on select", async () => {
    const options = [
      { value: "value1", label: "label1" },
      { value: "value2", label: "label2" },
      { value: "value3", label: "label3" },
    ];
    const { container, selectedValuesStringStore } = renderSelectInputWithValueAndOptions(
      "",
      options
    );
    await fireEvent.click(container.querySelector("input"));
    await fireEvent.click(container.querySelectorAll(".listContainer .listItem .item")[1]);
    expect(get(selectedValuesStringStore)).toEqual(options[1].value);
  });
});
