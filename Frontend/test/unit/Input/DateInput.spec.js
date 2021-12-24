import DateInput from "../../../src/components/Input/DateInput";
import { render, fireEvent } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";

const renderDateInputWithTimeMillis = (timeMillis, quickset = {}) => {
  const timeMillisStore = writable();
  timeMillisStore.set(timeMillis);
  const { container, getByText } = render(
    html`<${DateInput} bind:value=${timeMillisStore} quickset=${quickset} />`
  );
  const textInput = container.querySelector('input[type="text"]');
  return {
    textInput,
    timeMillisStore,
    container,
    getByText,
  };
};

const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(
    date.getMonth() + 1
  ).padStart(2, 0)}.${date.getFullYear()}`;

describe("DateInput", () => {
  it("displays formatted date for given time millis", () => {
    const { textInput } = renderDateInputWithTimeMillis(1);
    expect(textInput).toHaveValue("01.01.1970");
  });

  it("displays '-' if timeMillis is 0", () => {
    const { textInput } = renderDateInputWithTimeMillis(0);
    expect(textInput).toHaveValue("-");
  });

  it("displays no clear button if timeMillis = 0", () => {
    const { container } = renderDateInputWithTimeMillis(0);
    expect(container.querySelectorAll(".clear").length).toEqual(0);
  });

  it("displays clear button if timeMillis != 0", () => {
    const { container } = renderDateInputWithTimeMillis(1);
    expect(container.querySelectorAll(".clear").length).toEqual(1);
  });

  it("clear button sets timeMillis to 0", async () => {
    const { container, timeMillisStore } = renderDateInputWithTimeMillis(1);
    expect(get(timeMillisStore)).toEqual(1);
    await fireEvent.click(container.querySelector(".clear"));
    expect(get(timeMillisStore)).toEqual(0);
  });

  it("shows today in datepicker if timeMillis = 0", async () => {
    const { container, textInput } = renderDateInputWithTimeMillis(0);
    await fireEvent.click(textInput);
    await fireEvent.click(container.querySelector(".highlighted"));
    await fireEvent.click(container.querySelector(".toolbar button"));
    expect(textInput).toHaveValue(dateToString(new Date()));
  });

  it("displays all quickset buttons", () => {
    const quicksetConfig = {
      0: "Heute",
      7: "1 Woche",
      14: "2 Wochen",
      21: "3 Wochen",
    };
    const { container } = renderDateInputWithTimeMillis(0, quicksetConfig);
    const quicksetButtons = container.querySelectorAll(".button-tight");
    expect(quicksetButtons.length).toEqual(Object.keys(quicksetConfig).length);
    Object.keys(quicksetConfig).forEach((k, i) => {
      expect(quicksetButtons[i].textContent).toEqual(quicksetConfig[k]);
    });
  });
});
