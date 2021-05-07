import TextInput from "../../../src/components/Input/TextInput";
import { render } from "@testing-library/svelte";
import html from "svelte-htm";
import { writable, get } from "svelte/store";
import userEvent from "@testing-library/user-event";

const renderTextInputWithValue = (value) => {
  const valueStore = writable();
  valueStore.set(value);
  const onChangeMock = jest.fn();
  const { container } = render(
    html`<${TextInput} bind:value=${valueStore} on:change=${onChangeMock} />`
  );
  const textInput = container.querySelector('input[type="text"]');
  return {
    textInput: textInput,
    valueStore: valueStore,
    container: container,
    onChangeMock: onChangeMock,
  };
};

describe("TextInput", () => {
  it("displays given value", () => {
    const { textInput } = renderTextInputWithValue("value");
    expect(textInput).toHaveValue("value");
  });

  it("updates value on input", () => {
    const { textInput, valueStore } = renderTextInputWithValue("");
    userEvent.type(textInput, "abc");
    expect(get(valueStore)).toBe("abc");
  });

  it("fires change event", () => {
    const { textInput, onChangeMock } = renderTextInputWithValue("");
    userEvent.type(textInput, "a");
    expect(onChangeMock).toHaveBeenCalled();
  });
});
