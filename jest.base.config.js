process.env.TZ = 'GMT';

const transformIgnorePatterns = [
  '.*\\.mjs$',
  'ol',
  'observable-fns',
  'quick-lru',
  'nanoid',
  'earcut',
  'pbf',
  'rbush',
  '@tinyhttp/',
  '@stardazed',
  'quickselect',
  'color-(space|parse|rgba|name)',
  'uuid',
];

module.exports = {
  setupFiles: [],
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
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/(?!(${transformIgnorePatterns.join('|')}/))`],
};
