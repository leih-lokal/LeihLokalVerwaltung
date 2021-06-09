import { expect } from "chai";
import SelectorBuilder from "../../src/database/SelectorBuilder";

var selectorBuilder;

const numericColumn = {
  title: "Id",
  key: "id",
  numeric: true,
};

const textColumn = (name) => ({
  title: name,
  key: name.toLowerCase(),
});

describe("SelectorBuilder", () => {
  beforeEach(() => {
    selectorBuilder = new SelectorBuilder();
  });

  it("builds correct selector for numeric id 0", () => {
    let selector = selectorBuilder.searchTerm("0", [numericColumn]).build();

    expect(selector).to.deep.equal({
      $and: [
        {
          $or: [
            { id: { $eq: 0 } },
            { $and: [{ id: { $gte: 100 } }, { id: { $lt: 1000 } }] },
          ],
        },
      ],
    });
  });

  it("builds correct selector for numeric id 00", () => {
    let selector = selectorBuilder.searchTerm("00", [numericColumn]).build();

    expect(selector).to.deep.equal({
      $and: [
        {
          $or: [
            { id: { $eq: 0 } },
            { $and: [{ id: { $gte: 10 } }, { id: { $lt: 100 } }] },
          ],
        },
      ],
    });
  });

  it("builds correct selector for numeric id 000", () => {
    let selector = selectorBuilder.searchTerm("000", [numericColumn]).build();

    expect(selector).to.deep.equal({
      $and: [
        {
          $or: [
            { id: { $eq: 0 } },
            { $and: [{ id: { $gte: 1 } }, { id: { $lt: 10 } }] },
          ],
        },
      ],
    });
  });

  it("builds correct selector for numeric id 1", () => {
    let selector = selectorBuilder.searchTerm("1", [numericColumn]).build();

    expect(selector).to.deep.equal({
      $and: [
        {
          $or: [
            { id: { $eq: 1 } },
            { $and: [{ id: { $gte: 10 } }, { id: { $lt: 20 } }] },
            { $and: [{ id: { $gte: 100 } }, { id: { $lt: 200 } }] },
            { $and: [{ id: { $gte: 1000 } }, { id: { $lt: 2000 } }] },
            { $and: [{ id: { $gte: 10000 } }, { id: { $lt: 20000 } }] },
          ],
        },
      ],
    });
  });

  it("builds correct selector for one column text search", () => {
    let selector = selectorBuilder
      .searchTerm("searchTerm", [textColumn("Column1")])
      .build();
    expect(selector).to.deep.equal({
      $and: [{ $or: [{ column1: { $regex: "(?i)searchterm" } }] }],
    });
  });

  it("builds correct selector for multi column text search", () => {
    let selector = selectorBuilder
      .searchTerm("searchTerm", [textColumn("Column1"), textColumn("Column2")])
      .build();
    expect(selector).to.deep.equal({
      $and: [
        {
          $or: [
            { column1: { $regex: "(?i)searchterm" } },
            { column2: { $regex: "(?i)searchterm" } },
          ],
        },
      ],
    });
  });
});
