import { saveParseTimestampToString, saveParseStringToBoolean } from "../../src/utils/utils.js";

describe("saveParseTimestampToString", () => {
  it("returns a date string for a valid input", () => {
    expect(saveParseTimestampToString(new Date(2020, 4, 2).getTime())).toEqual("02.05.2020");
  });

  it("returns an empty string for an invalid input", () => {
    expect(saveParseTimestampToString("wefwfge")).toEqual("");
  });

  it("returns an empty string for 0 input", () => {
    expect(saveParseTimestampToString(0)).toEqual("");
  });
});

describe("saveParseStringToBoolean", () => {
  it("returns true for 'true' or 'ja'", () => {
    expect(saveParseStringToBoolean("true")).toEqual(true);
    expect(saveParseStringToBoolean("ja")).toEqual(true);
    expect(saveParseStringToBoolean("TrUe")).toEqual(true);
  });

  it("returns false for 'false' or 'nein'", () => {
    expect(saveParseStringToBoolean("false")).toEqual(false);
    expect(saveParseStringToBoolean("nein")).toEqual(false);
    expect(saveParseStringToBoolean("FaLse")).toEqual(false);
  });
});
