const { viewerProjects, adminProjects } = require("./jest.projects");

module.exports = {
  globalSetup: 'jest-preset-angular/global-setup',
  projects: [
    ...viewerProjects,
    ...adminProjects,
  ],
};
