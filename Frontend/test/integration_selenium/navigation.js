const { expect } = require("chai");
const { By } = require("selenium-webdriver");
const { setupDriver } = require("./util.js");

describe("Navigation", function () {
  var driver;

  const getElementByText = (text) => driver.findElement(By.linkText(text));

  before(async () => {
    driver = await setupDriver();
  });

  it("redirects to /customers", async () => {
    await driver.get("http://localhost:5000");
    expect(await driver.getCurrentUrl()).to.equal(
      "http://localhost:5000/#/customers"
    );
  });

  it("redirects to '/rentals' when 'Leihvorgänge' is clicked", async () => {
    await driver.get("http://localhost:5000/#/items");
    await getElementByText("Leihvorgänge").click();
    expect(await driver.getCurrentUrl()).to.equal(
      "http://localhost:5000/#/rentals"
    );
  });

  it("redirects to '/items' when 'Gegenstände' is clicked", async () => {
    await driver.get("http://localhost:5000/#/rentals");
    await getElementByText("Gegenstände").click();
    expect(await driver.getCurrentUrl()).to.equal(
      "http://localhost:5000/#/items"
    );
  });

  it("redirects to '/customers' when 'Nutzer' is clicked", async () => {
    await driver.get("http://localhost:5000/#/items");
    await getElementByText("Nutzer").click();
    expect(await driver.getCurrentUrl()).to.equal(
      "http://localhost:5000/#/customers"
    );
  });

  it("highlights 'Leihvorgänge' in navbar", async () => {
    await driver.get("http://localhost:5000/#/rentals");
    expect(
      await getElementByText("Leihvorgänge").getCssValue("color")
    ).to.equal("rgba(255, 205, 88, 1)");
    expect(await getElementByText("Nutzer").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
  });

  it("highlights 'Gegenstände' in navbar", async () => {
    await driver.get("http://localhost:5000/#/items");
    expect(
      await getElementByText("Leihvorgänge").getCssValue("color")
    ).to.equal("rgba(255, 255, 255, 1)");
    expect(await getElementByText("Nutzer").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 205, 88, 1)"
    );
  });

  it("highlights 'Nutzer' in navbar", async () => {
    await driver.get("http://localhost:5000/#/customers");
    expect(
      await getElementByText("Leihvorgänge").getCssValue("color")
    ).to.equal("rgba(255, 255, 255, 1)");
    expect(await getElementByText("Nutzer").getCssValue("color")).to.equal(
      "rgba(255, 205, 88, 1)"
    );
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
  });

  after(async () => {
    await driver.quit();
  });
});
