module.exports = {
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    "\\.svelte$": ["svelte-jest"],
  },
  moduleFileExtensions: ["js", "svelte"],
  bail: false,
  verbose: true,
  transformIgnorePatterns: ["node_modules/(?!(svelte-checkbox)/)"],
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "jest-svelte-events/extend-expect",
  ],
  moduleDirectories: ["node_modules", "src", "tests"],
  modulePaths: ["<rootDir>", "<rootDir>/src", "<rootDir>/node_modules", "<rootDir>/tests"],
};
