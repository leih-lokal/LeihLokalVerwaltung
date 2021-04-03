const { Builder } = require("selenium-webdriver");

const TIMEOUT = 30000; // 30s

const setupDriver = async () => {
  driver = new Builder()
    .forBrowser("chrome")
    // run headless only when executed by github actions
    .setChromeOptions(process.env.CI && new Options().headless())
    .build();
  await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  return driver;
};

export default { setupDriver };
