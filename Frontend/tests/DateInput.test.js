import DateInput from "../src/components/DateInput.svelte";
import { render, fireEvent } from "@testing-library/svelte";

it("it works", async () => {
  const { getByText } = render(DateInput, {
    props: {
      selected: new Date(),
    },
  });

  expect(getByText("1")).toBeInTheDocument();
});
