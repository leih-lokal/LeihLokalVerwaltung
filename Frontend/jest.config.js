module.exports = {
  collectCoverage: false,
  bail: false,
  verbose: true,
  testRegex: "./spec/.*.spec.js$",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "jest-svelte-events/extend-expect",
  ],
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.svelte$": "svelte-jester",
  },
  transformIgnorePatterns: ["node_modules/(?!(fa-svelte|svelte-select|svelte-calendar)/)"],
  moduleFileExtensions: ["js", "svelte"],
};
