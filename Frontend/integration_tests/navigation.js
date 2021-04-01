const { expect } = require("chai");
const { By, Builder, webdriver, Capabilities } = require("selenium-webdriver");
const { Options } = require("selenium-webdriver/chrome");

const TIMEOUT = 30000; // 30s

describe("Navigation", function () {
  var driver;

  const getElementByText = (text) => driver.findElement(By.linkText(text));

  before(async () => {
    var chromeCapabilities = Capabilities.chrome();
    var chromeOptions = {
      args: ["--headless"],
    };
    chromeCapabilities.set("chromeOptions", chromeOptions);

    driver = new Builder()
      .forBrowser("chrome")
      //.usingServer("http://localhost:4444/wd/hub")
      .withCapabilities({
        maxInstances: 5, // 5 parallel threads
        browserName: "chrome",
      })
      .setChromeOptions(new Options().headless())
      .build();
    await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  });

  it("redirects to /rentals", async () => {
    await driver.get("http://localhost:5000");
    expect(await driver.getCurrentUrl()).to.equal("http://localhost:5000/#/rentals");
  });

  it("redirects to '/rentals' when 'Leihvorgänge' is clicked", async () => {
    await driver.get("http://localhost:5000/#/items");
    await getElementByText("Leihvorgänge").click();
    expect(await driver.getCurrentUrl()).to.equal("http://localhost:5000/#/rentals");
  });

  it("redirects to '/items' when 'Gegenstände' is clicked", async () => {
    await driver.get("http://localhost:5000/#/rentals");
    await getElementByText("Gegenstände").click();
    expect(await driver.getCurrentUrl()).to.equal("http://localhost:5000/#/items");
  });

  it("redirects to '/customers' when 'Kunden' is clicked", async () => {
    await driver.get("http://localhost:5000/#/items");
    await getElementByText("Kunden").click();
    expect(await driver.getCurrentUrl()).to.equal("http://localhost:5000/#/customers");
  });

  it("highlights 'Leihvorgänge' in navbar", async () => {
    await driver.get("http://localhost:5000/#/rentals");
    expect(await getElementByText("Leihvorgänge").getCssValue("color")).to.equal(
      "rgba(255, 208, 0, 1)"
    );
    expect(await getElementByText("Kunden").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
  });

  it("highlights 'Gegenstände' in navbar", async () => {
    await driver.get("http://localhost:5000/#/items");
    expect(await getElementByText("Leihvorgänge").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Kunden").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 208, 0, 1)"
    );
  });

  it("highlights 'Kunden' in navbar", async () => {
    await driver.get("http://localhost:5000/#/customers");
    expect(await getElementByText("Leihvorgänge").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
    expect(await getElementByText("Kunden").getCssValue("color")).to.equal("rgba(255, 208, 0, 1)");
    expect(await getElementByText("Gegenstände").getCssValue("color")).to.equal(
      "rgba(255, 255, 255, 1)"
    );
  });

  after(function () {
    driver.quit();
  });
});
