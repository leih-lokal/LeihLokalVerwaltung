import filters from "../../../src/components/TableEditors/Items/Filters.js";

const items = [
  {
    _id: "1",
    status_on_website: "xxx",
    category: "unknown",
  },
  {
    _id: "2",
    category: "unknown",
  },
  {
    _id: "3",
    status_on_website: "xxx",
  },
  {
    _id: "4",
    status_on_website: "deleted",
    category: "Küche",
  },
  {
    _id: "5",
    status_on_website: "outofstock",
    category: "Haushalt",
  },
  {
    _id: "6",
    status_on_website: "instock",
    category: "Garten",
  },
  {
    _id: "7",
    status_on_website: "instock",
    category: "Heimwerker",
  },
  {
    _id: "8",
    status_on_website: "deleted",
    category: "Kinder",
  },
  {
    _id: "9",
    status_on_website: "instock",
    category: "Freizeit",
  },
];

describe("Filter Items", () => {
  const applyFilter = (name) => items.filter(filters.filters[name]).map((item) => item._id);

  it("nicht gelöscht", () =>
    expect(applyFilter("nicht gelöscht")).toEqual(["1", "2", "3", "5", "6", "7", "9"]));

  it("gelöscht", () => expect(applyFilter("gelöscht")).toEqual(["4", "8"]));

  it("verfügbar", () => expect(applyFilter("verfügbar")).toEqual(["6", "7", "9"]));

  it("ausgeliehen", () => expect(applyFilter("ausgeliehen")).toEqual(["5"]));

  it("Kategorie Küche", () => expect(applyFilter("Kategorie Küche")).toEqual(["4"]));
  it("Kategorie Haushalt", () => expect(applyFilter("Kategorie Haushalt")).toEqual(["5"]));
  it("Kategorie Garten", () => expect(applyFilter("Kategorie Garten")).toEqual(["6"]));
  it("Kategorie Heimwerker", () => expect(applyFilter("Kategorie Heimwerker")).toEqual(["7"]));
  it("Kategorie Kinder", () => expect(applyFilter("Kategorie Kinder")).toEqual(["8"]));
  it("Kategorie Freizeit", () => expect(applyFilter("Kategorie Freizeit")).toEqual(["9"]));
});
