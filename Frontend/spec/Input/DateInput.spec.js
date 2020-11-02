import DateInput from "../../src/components/Input/DateInput";
import { render, fireEvent } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";

const renderDateInputWithTimeMillis = (timeMillis) => {
  const timeMillisStore = writable();
  timeMillisStore.set(timeMillis);
  const { container, getAllByText } = render(
    html`<${DateInput} bind:timeMillis=${timeMillisStore} />`
  );
  const textInput = container.querySelector('input[type="text"]');
  return {
    textInput: textInput,
    timeMillisStore: timeMillisStore,
    container: container,
    pickAnotherDate: async () => {
      await fireEvent.click(textInput);
      await fireEvent.click(getAllByText("1")[0]);
    },
    openAndCloseDatePicker: async () => {
      await fireEvent.click(textInput);
      await fireEvent.keyDown(container, { key: "Escape", code: 27 });
    },
  };
};

const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
    2,
    0
  )}.${date.getFullYear()}`;

describe("DateInput", () => {
  beforeAll(() => {});
  it("displays formatted date for given time millis", () => {
    const { textInput } = renderDateInputWithTimeMillis(1);
    expect(textInput).toHaveValue("01.01.1970");
  });

  it("displays '-' if time millis is 0", () => {
    const { textInput } = renderDateInputWithTimeMillis(0);
    expect(textInput).toHaveValue("-");
  });

  it("selects today when opening datepicker with timeMillis 0", async () => {
    const { textInput, openAndCloseDatePicker } = renderDateInputWithTimeMillis(0);
    expect(textInput).toHaveValue("-");
    await openAndCloseDatePicker();
    expect(textInput).toHaveValue(dateToString(new Date()));
  });

  /**
  it("does not change selected date when opening datepicker with timeMillis 1", async () => {
    const { textInput, openAndCloseDatePicker } = renderDateInputWithTimeMillis(1);
    //expect(textInput).toHaveValue(dateToString(new Date(1)));
    await openAndCloseDatePicker();
    expect(textInput).toHaveValue(dateToString(new Date(1)));
  }); */
});
