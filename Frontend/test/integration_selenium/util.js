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
