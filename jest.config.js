require('jest-preset-angular/ngcc-jest-processor');

module.exports = {
  projects: [
    '<rootDir>/projects/api',
    '<rootDir>/projects/app',
    '<rootDir>/projects/core',
    '<rootDir>/projects/map',
    '<rootDir>/projects/shared',
  ]
};
