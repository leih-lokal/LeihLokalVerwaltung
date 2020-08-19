import { saveParseDateToString, saveParseStringToTimeMillis, saveParseStringToInt, saveParseStringToBoolean } from "../src/utils/utils.js";

describe("saveParseDateToString", () => {

    it("parses and formats a valid date string", () => {
        expect(saveParseDateToString("02/03/2020")).toEqual("03.02.2020");
    });

    it("returns 'unbekannt' for invalid date strings", () => {
        expect(saveParseDateToString("wefwfge")).toEqual("unbekannt");
    });

});

describe("saveParseStringToTimeMillis", () => {

    it("returns the time in millis for a valid date string", () => {
        expect(saveParseStringToTimeMillis("02.04.2020")).toEqual(new Date(2020, 4, 2).getTime());
    });

    it("returns 0 for an invalid date string", () => {
        expect(saveParseStringToTimeMillis("02.042020")).toEqual(0);
    });

});

describe("saveParseStringToInt", () => {

    it("returns an integer for a valid string", () => {
        expect(saveParseStringToInt("123")).toEqual(123);
    });

    it("returns the input value for an invalid string", () => {
        expect(saveParseStringToInt("invalid")).toEqual("invalid");
    });

});

describe("saveParseStringToBoolean", () => {

    it("returns true for 'true' or 'ja'", () => {
        expect(saveParseStringToBoolean("true")).toEqual(true);
        expect(saveParseStringToBoolean("ja")).toEqual(true);
        expect(saveParseStringToBoolean("TrUe")).toEqual(true);
    })

    it("returns false for 'false' or 'nein'", () => {
        expect(saveParseStringToBoolean("false")).toEqual(false);
        expect(saveParseStringToBoolean("nein")).toEqual(false);
        expect(saveParseStringToBoolean("FaLse")).toEqual(false);
    })

});