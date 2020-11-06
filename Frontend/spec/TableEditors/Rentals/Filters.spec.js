import filters from "../../../src/components/TableEditors/Rentals/Filters.js";

const CURRENT_MILLIS = new Date().getTime();
const ONE_WEEK_MILLIS = 7 * 24 * 60 * 60 * 1000;

const rentals = [
  {
    _id: "1",
    to_return_on: CURRENT_MILLIS + ONE_WEEK_MILLIS,
  },
  {
    _id: "2",
    to_return_on: CURRENT_MILLIS,
  },
  {
    _id: "3",
    to_return_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
  },
  {
    _id: "4",
    to_return_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
    returned_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
  },
  {
    _id: "5",
    to_return_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
    returned_on: CURRENT_MILLIS - ONE_WEEK_MILLIS - 60000,
  },
  {
    _id: "6",
    to_return_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
    returned_on: CURRENT_MILLIS - ONE_WEEK_MILLIS + 60000,
  },
  {
    _id: "7",
    to_return_on: CURRENT_MILLIS,
    returned_on: CURRENT_MILLIS,
  },
  {
    _id: "8",
    to_return_on: CURRENT_MILLIS - 2 * ONE_WEEK_MILLIS,
    returned_on: CURRENT_MILLIS - ONE_WEEK_MILLIS,
  },
  {
    _id: "9",
    to_return_on: CURRENT_MILLIS + 60000,
  },
  {
    _id: "10",
    to_return_on: CURRENT_MILLIS - 60000,
  },
];

describe("Filter Rentals", () => {
  const applyFilter = (name) => rentals.filter(filters.filters[name]).map((rental) => rental._id);

  it("nicht abgeschlossen", () =>
    expect(applyFilter("nicht abgeschlossen")).toEqual(["1", "2", "3", "7", "9", "10"]));

  it("abgeschlossen", () =>
    expect(applyFilter("abgeschlossen")).toEqual(["4", "5", "6", "7", "8"]));

  it("Rückgabe heute", () => expect(applyFilter("Rückgabe heute")).toEqual(["2", "7", "9", "10"]));

  it("verspätet", () => expect(applyFilter("verspätet")).toEqual(["3", "8"]));
});
