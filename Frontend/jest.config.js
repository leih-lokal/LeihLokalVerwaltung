module.exports = {
  collectCoverage: false,
  bail: false,
  verbose: true,
  testRegex: "./test/unit/.*.spec.js$",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "jest-svelte-events/extend-expect",
    "svelte-jester-mock/dist/extend-jest",
  ],
  transform: {
    "\\.js$": "babel-jest",
    "^.+\\.svelte$": "svelte-jester",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(fa-svelte|svelte-select|.beyonk|dayjs)/)",
  ],
  moduleFileExtensions: ["js", "svelte"],
};
