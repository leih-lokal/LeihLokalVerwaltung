import RowsProcessor from "../src/components/Table/RowsProcessor.js";

var rowsProcessor;
var testRows;

beforeEach(() => {
    rowsProcessor = new RowsProcessor([
        {
            title: "Id",
            key: "_id",
        },
        {
            title: "Nachname",
            key: "lastname",
            sort: (value) => value.replace("a", "z"),
        },
        {
            title: "Vorname",
            key: "firstname",
            display: (value) => value + "display"
        },
    ]);

    testRows = [
        {
            _id: 0,
            firstname: "pljrtbr",
            lastname: "sdvbtrr"
        },
        {
            _id: 4,
            firstname: "jtzj63j",
            lastname: "sdvebe"
        },
        {
            _id: 2,
            firstname: "ziuopo",
            lastname: "avdb3rt"
        },
        {
            _id: 1,
            firstname: "iukztjr",
            lastname: "bergw"
        },
        {
            _id: 3,
            firstname: "rwtwer",
            lastname: "mzikzu"
        }
    ];
});

describe("RowsProcessor", () => {

    it("gets a row by id", () => {
        const expected = {
            _id: 1,
            firstname: "iukztjr",
            lastname: "bergw"
        };
        expect(rowsProcessor.getRowById(testRows, 1)).toEqual(expected);
    });

    it("sorts int values by column key", () => {
        const expected = [
            {
                _id: 0,
                firstname: "pljrtbr",
                lastname: "sdvbtrr"
            },
            {
                _id: 1,
                firstname: "iukztjr",
                lastname: "bergw"
            },
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt"
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu"
            },
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe"
            }
        ]
        expect(rowsProcessor.sortByColumnKey(testRows, "_id", false)).toEqual(expected);
    })

    it("reverse sorts int values by column key", () => {
        const expected = [
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe"
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu"
            },
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt"
            },
            {
                _id: 1,
                firstname: "iukztjr",
                lastname: "bergw"
            },
            {
                _id: 0,
                firstname: "pljrtbr",
                lastname: "sdvbtrr"
            }
        ]
        expect(rowsProcessor.sortByColumnKey(testRows, "_id", true)).toEqual(expected);
    })

    it("sorts string values by column key", () => {
        const expected = [
            {
                _id: 1,
                firstname: "iukztjr",
                lastname: "bergw"
            },
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe"
            },
            {
                _id: 0,
                firstname: "pljrtbr",
                lastname: "sdvbtrr"
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu"
            },
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt"
            }
        ]
        expect(rowsProcessor.sortByColumnKey(testRows, "firstname", false)).toEqual(expected);
    })

    it("reverse sorts string values by column key", () => {
        const expected = [
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt"
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu"
            },
            {
                _id: 0,
                firstname: "pljrtbr",
                lastname: "sdvbtrr"
            },
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe"
            },
            {
                _id: 1,
                firstname: "iukztjr",
                lastname: "bergw"
            }
        ]
        expect(rowsProcessor.sortByColumnKey(testRows, "firstname", true)).toEqual(expected);
    })

    it("sorts string values by column key and sort function", () => {
        const expected = [
            {
                _id: 1,
                firstname: "iukztjr",
                lastname: "bergw"
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu"
            },
            {
                _id: 0,
                firstname: "pljrtbr",
                lastname: "sdvbtrr"
            },
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe"
            },
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt"
            }
        ]
        expect(rowsProcessor.sortByColumnKey(testRows, "lastname", false)).toEqual(expected);
    })

    it("generates display rows", () => {
        const expected = [
            {
                _id: 0,
                firstname: "pljrtbrdisplay",
                lastname: "sdvbtrr"
            },
            {
                _id: 4,
                firstname: "jtzj63jdisplay",
                lastname: "sdvebe"
            },
            {
                _id: 2,
                firstname: "ziuopodisplay",
                lastname: "avdb3rt"
            },
            {
                _id: 1,
                firstname: "iukztjrdisplay",
                lastname: "bergw"
            },
            {
                _id: 3,
                firstname: "rwtwerdisplay",
                lastname: "mzikzu"
            }
        ]
        const actual = rowsProcessor.generateDisplayRows(testRows);
        expected.forEach(x => expect(actual).toContainEqual(x));
    })

    it("filters by all values", () => {
        const expected = [
            {
                _id: 4,
                firstname: "jtzj63j",
                lastname: "sdvebe",
                index: 0
            },
            {
                _id: 2,
                firstname: "ziuopo",
                lastname: "avdb3rt",
                index: 1
            },
            {
                _id: 3,
                firstname: "rwtwer",
                lastname: "mzikzu",
                index: 2
            }
        ]
        const actual = rowsProcessor.filterRows(testRows, "3");
        expect(actual.length).toEqual(expected.length);
        expected.forEach(x => expect(actual).toContainEqual(x));
    })

});