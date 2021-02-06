import LocalDatabase from "../../src/components/Database/LocalDatabase";

describe("Database", () => {
  it("creates all views", async () => {
    let database = new LocalDatabase();
    await database.connect();
    await database.createAllViews();
  });
});
