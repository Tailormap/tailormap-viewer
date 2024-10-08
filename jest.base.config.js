process.env.TZ = 'GMT';

module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/../../setup-jest.ts'],
  "testRegex": "((\\.|/*.)(spec))\\.ts?$",
  moduleNameMapper: {
    "^@tailormap-viewer/(.*)$": "<rootDir>/../../projects/$1/src",
    "^@tailormap-admin/(.*)$": "<rootDir>/../../projects/$1/src"
  },
  transform: {
    '^.+\\.(ts|js|html|svg)$': [
      'jest-preset-angular',
      {
        stringifyContentPathRegex: '\\.(html|svg)$',
        isolatedModules: true,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|ol|observable-fns|quick-lru|nanoid|earcut|pbf|rbush|@tinyhttp/|@stardazed|color-(space|parse|rgba|name)/)|quickselect)'],
};
