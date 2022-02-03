const path = require('path');
const { runCommand, checkCleanGitRepo, requestProject} = require("./shared");

checkCleanGitRepo();

const publishRelease = (project) => {
  runCommand('npm', ['version', 'patch'], path.resolve(__dirname, '../projects/', project))
    .then(() => runCommand('ng', ['build', project]))
    .then(() => runCommand('npm', ['publish', '--scope=@tailormap-viewer', '--registry=https://repo.b3p.nl/nexus/repository/npm-public'], path.resolve(__dirname, '../dist/', project)))
    .then(() => runCommand('git', ['add', '-A']))
    .then(() => {
      const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
      return runCommand('git', ['commit', '-m', `Released version ${currentVersion} of ${project} project`]);
    });
};

requestProject('Select the project for which to make a release', publishRelease);
