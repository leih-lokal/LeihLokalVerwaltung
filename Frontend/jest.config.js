module.exports = {
  collectCoverage: true,
  bail: false,
  verbose: true,
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "jest-svelte-events/extend-expect",
  ],
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.svelte$": "svelte-jester",
  },
  transformIgnorePatterns: ["node_modules/(?!(fa-svelte)/)"],
  moduleFileExtensions: ["js", "svelte"],
};
