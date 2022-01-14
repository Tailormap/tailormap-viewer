module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/../../setup-jest.ts'],
  "testRegex": "((\\.|/*.)(spec))\\.ts?$",
  moduleNameMapper: {
    "^@tailormap-viewer/(.*)$": "<rootDir>/../../projects/$1/src"
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|ol|observable-fns))'],
};
