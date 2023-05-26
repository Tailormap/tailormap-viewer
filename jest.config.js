const { viewerProjects, adminProjects } = require("./jest.projects");

module.exports = {
  projects: [
    ...viewerProjects,
    ...adminProjects,
  ],
};
