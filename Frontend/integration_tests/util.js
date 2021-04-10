const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const TIMEOUT = 30000; // 30s

exports.setupDriver = async () => {
  const driver = new Builder()
    .forBrowser("chrome")
    // run headless only when executed by github actions
    .setChromeOptions(process.env.CI && new chrome.Options().headless())
    .build();
  await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  return driver;
};
