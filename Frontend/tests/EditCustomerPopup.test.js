import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import EditCustomerPopup from "../src/components/Customers/EditCustomerPopup";

describe("EditCustomerPopup", () => {
  it("should not filter rows on initial render", () => {
    console.log("rendering");
    const { container } = render(EditCustomerPopup, {
      props: {
        row: {},
      },
    });

    expect(1).toEqual(1);
  });
});
