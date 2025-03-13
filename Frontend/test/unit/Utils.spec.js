import { parseTimestampToString, parseStringToBoolean } from "../../src/utils/utils.js";

describe("parseTimestampToString", () => {
  it("returns a date string for a valid input", () => {
    expect(parseTimestampToString(new Date(2020, 4, 2).getTime())).toEqual("02.05.2020");
  });

  it("returns an empty string for an invalid input", () => {
    expect(parseTimestampToString("wefwfge")).toEqual("");
  });

  it("returns an empty string for 0 input", () => {
    expect(parseTimestampToString(0)).toEqual("");
  });
});

describe("parseStringToBoolean", () => {
  it("returns true for 'true' or 'ja'", () => {
    expect(parseStringToBoolean("true")).toEqual(true);
    expect(parseStringToBoolean("ja")).toEqual(true);
    expect(parseStringToBoolean("TrUe")).toEqual(true);
  });

  it("returns false for 'false' or 'nein'", () => {
    expect(parseStringToBoolean("false")).toEqual(false);
    expect(parseStringToBoolean("nein")).toEqual(false);
    expect(parseStringToBoolean("FaLse")).toEqual(false);
  });
});
