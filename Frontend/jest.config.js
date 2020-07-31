module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.svelte$": "svelte-jest",
  },
  moduleFileExtensions: ["js", "svelte", "json"],
  testPathIgnorePatterns: ["node_modules"],
  bail: false,
  verbose: true,
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect", "svelte-mock/extend"],
  moduleDirectories: ["node_modules", "src", "tests"],
  modulePaths: ["<rootDir>", "<rootDir>/src", "<rootDir>/node_modules", "<rootDir>/tests"],
  testEnvironment: "jest-environment-jsdom",
};
