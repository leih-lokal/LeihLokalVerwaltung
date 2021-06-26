const { By, until } = require("selenium-webdriver");
const { expect } = require("chai");
const { setupDriver, sleep, waitForDataToLoad } = require("../util.js");
const fs = require("fs");

const expectedData = {
  sortedByIdAsc: require("./expectedData/sortedByIdAsc.js"),
  sortedByIdDesc: require("./expectedData/sortedByIdDesc.js"),
};

describe("Displays customers", function () {
  var driver;

  before(async () => {
    driver = await setupDriver();
  });

  const getDisplayedTableData = async () => {
    let rows = await driver.findElements(By.css("tbody tr"));
    return await Promise.all(
      rows.map(async (row) => {
        let cells = await row.findElements(By.css("td"));
        return await Promise.all(
          cells.map(async (cell) => ({
            text: await cell.getText(),
            backgroundColor: await cell.getCssValue("background-color"),
          }))
        );
      })
    );
  };

  const openPage = async () => {
    await driver.get("http://localhost:5000/#/customers");
    await waitForDataToLoad(driver);
  };

  const expectDisplaysData = async (expectedDataToBeDisplayed) => {
    expect(await getDisplayedTableData()).to.deep.equal(
      expectedDataToBeDisplayed
    );
  };

  const writeFile = (array) => {
    fs.writeFile("output.json", JSON.stringify(array), "utf8", function (err) {
      if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
      }

      console.log("JSON file has been saved.");
    });
  };

  const clickTableHeader = async (text) => {
    let columnHeader = await driver.findElement(
      By.xpath(`//*/thead/tr/th[contains(text(),'${text}')]`)
    );
    await columnHeader.click();
    await waitForDataToLoad(driver);
  };

  it("displays customers in default order", async () => {
    await openPage();
    await expectDisplaysData(expectedData.sortedByIdAsc);
  });

  it("sorts by id desc", async () => {
    await openPage();
    await clickTableHeader("Id");
    await expectDisplaysData(expectedData.sortedByIdDesc);
  });

  it("sorts by lastname asc", async () => {
    await openPage();
    await clickTableHeader("Nachname");
    await expectDisplaysData(expectedData.sortedByIdAsc);
  });

  it("sorts by lastname desc", async () => {
    await openPage();
    await clickTableHeader("Nachname");
    await clickTableHeader("Nachname");
    await expectDisplaysData(expectedData.sortedByIdDesc);
  });

  it("sorts by street asc", async () => {
    await openPage();
    await clickTableHeader("Straße");
    await expectDisplaysData(expectedData.sortedByIdAsc);
  });

  it("sorts by street desc", async () => {
    await openPage();
    await clickTableHeader("Straße");
    await clickTableHeader("Straße");
    await expectDisplaysData(expectedData.sortedByIdDesc);
  });

  it("sorts by registration date asc", async () => {
    await openPage();
    await clickTableHeader("Beitritt");
    await expectDisplaysData(expectedData.sortedByIdAsc);
  });

  it("sorts by registration date desc", async () => {
    await openPage();
    await clickTableHeader("Beitritt");
    await clickTableHeader("Beitritt");
    await expectDisplaysData(expectedData.sortedByIdDesc);
  });
});
