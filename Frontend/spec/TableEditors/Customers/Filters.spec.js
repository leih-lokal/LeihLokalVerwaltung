import filters from "../../../src/components/TableEditors/Customers/Filters.js";

const CURRENT_MILLIS = new Date().getTime();
const ONE_YEAR_MILLIS = 365 * 24 * 60 * 60 * 1000;

const customers = [
  {
    _id: "1",
    subscribed_to_newsletter: "ja",
    registration_date: CURRENT_MILLIS,
  },
  {
    _id: "2",
    subscribed_to_newsletter: "nein",
    registration_date: CURRENT_MILLIS - ONE_YEAR_MILLIS * 0.5,
  },
  {
    _id: "3",
    subscribed_to_newsletter: "ja",
    registration_date: CURRENT_MILLIS - ONE_YEAR_MILLIS,
    renewed_on: CURRENT_MILLIS,
  },
  {
    _id: "4",
    subscribed_to_newsletter: "",
    registration_date: CURRENT_MILLIS - ONE_YEAR_MILLIS * 1.5,
    renewed_on: CURRENT_MILLIS - ONE_YEAR_MILLIS * 0.5,
  },
  {
    _id: "5",
    subscribed_to_newsletter: "ja",
    registration_date: CURRENT_MILLIS - ONE_YEAR_MILLIS * 2,
    renewed_on: CURRENT_MILLIS - ONE_YEAR_MILLIS,
  },
];

describe("Filter Customers", () => {
  const applyFilter = (name) =>
    customers.filter(filters.filters[name]).map((customer) => customer._id);

  it("Newsletter: Ja", () => expect(applyFilter("Newsletter: Ja")).toEqual(["1", "3", "5"]));

  it("Beitritt vor > 1 Jahr", () =>
    expect(applyFilter("Beitritt vor > 1 Jahr")).toEqual(["3", "4", "5"]));

  it("Beitritt vor < 1 Jahr", () =>
    expect(applyFilter("Beitritt vor < 1 Jahr")).toEqual(["1", "2"]));

  it("Verlängert vor > 1 Jahr", () =>
    expect(applyFilter("Verlängert vor > 1 Jahr")).toEqual(["5"]));

  it("Verlängert vor < 1 Jahr", () =>
    expect(applyFilter("Verlängert vor < 1 Jahr")).toEqual(["3", "4"]));
});
