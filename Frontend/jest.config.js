module.exports = {
  bail: false,
  verbose: true,
  testRegex: "build/bundle-tests\\.js",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "jest-svelte-events/extend-expect",
  ],
};
