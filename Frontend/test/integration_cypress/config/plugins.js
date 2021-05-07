const rollupPreprocessor = require("@bahmutov/cy-rollup");

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  const options = {
    // Provide an alternative rollup config file.
    // The default is rollup.config.js at the project root.
    configFile: "./test/integration_cypress/config/rollup.config.js",
  };

  on("file:preprocessor", rollupPreprocessor(options));
};
