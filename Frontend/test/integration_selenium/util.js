const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const TIMEOUT = 30_000;

exports.setupDriver = async () => {
  const runningInGithubAction = process.env.CI;
  const chromeOptions = new chrome.Options().windowSize({ width: 1500, height: 900 });
  //runningInGithubAction &&
  chromeOptions.headless();

  const driver = new Builder().forBrowser("chrome").setChromeOptions(chromeOptions).build();
  await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  return driver;
};

exports.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.configureDbConnection = (driver) =>
  driver.executeScript(() => {
    localStorage.setItem("couchdbHost", "127.0.0.1");
    localStorage.setItem("couchdbHTTPS", "false");
    localStorage.setItem("couchdbPort", "5984");
    localStorage.setItem("couchdbUser", "user");
    localStorage.setItem("couchdbPassword", "password");
    localStorage.setItem("couchdbName", "leihlokal_test");
  });
