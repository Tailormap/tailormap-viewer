module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/../../setup-jest.ts'],
  "testRegex": "((\\.|/*.)(spec))\\.ts?$",
  moduleNameMapper: {
    "^@tailormap-viewer/(.*)$": "<rootDir>/../../projects/$1/src"
  },
  globals: {
    "ts-jest": {
      isolatedModules: true
    }
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|ol|observable-fns|quick-lru|nanoid))'],
};
