const { expect } = require("chai");
const { By } = require("selenium-webdriver");
const { setupDriver, sleep } = require("./util.js");

describe("Table Interactions", function () {
  var driver;

  const getElementByCss = (css) => driver.findElement(By.css(css));
  const gotoSecondPage = async () => {
    const secondPageButton = await getElementByCss(".pagination > a:nth-child(3)");
    await secondPageButton.click();
    await expectToBeOnPage(2);
  };
  const expectToBeOnPage = async (page) => {
    const currentPage = await getElementByCss(".pagination > .active");
    expect(await currentPage.getText()).to.equal(String(page));
  };

  before(async () => {
    driver = await setupDriver();
  });

  it("returns to first page when searching", async () => {
    await driver.get("http://localhost:5000/#/items");
    await gotoSecondPage();
    await getElementByCss(".searchInput").sendKeys("en");
    await sleep(800);
    await expectToBeOnPage(1);
  });

  it("returns to first page when filtering", async () => {
    await driver.get("http://localhost:5000/#/items");
    await gotoSecondPage();
    await getElementByCss(".selectContainer input").click();
    await getElementByCss(".selectContainer .listItem:nth-child(1)").click();
    await expectToBeOnPage(1);
  });

  it("returns to first page when sorting", async () => {
    await driver.get("http://localhost:5000/#/items");
    await gotoSecondPage();
    await getElementByCss("thead .clickable:nth-child(1)").click();
    await expectToBeOnPage(1);
  });

  after(async () => {
    await driver.quit();
  });
});
