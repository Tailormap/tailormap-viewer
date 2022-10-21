const path = require('path');
const { runCommand, checkCleanGitRepo, requestProject, availableProjects, getCliArgument, hasCliArgument} = require("./shared");
const fs = require("fs");

checkCleanGitRepo();

const scope = '@tailormap-viewer';

const publishRelease = (project, version, dryRun) => {
  const versionCommand = !!version ? ['version', version] : ['version', 'patch'];
  runCommand('npm', versionCommand, path.resolve(__dirname, '../projects/', project))
    .then(() => runCommand('ng', ['build', project]))
    .then(() => {
      if (dryRun) {
        console.log('Would publish ' + project + ' to https://repo.b3p.nl/nexus/repository/npm-public, but running in dry-run mode');
        return Promise.resolve();
      }
      return Promise.resolve();
      // return runCommand('npm', ['publish', '--scope=' + scope, '--registry=https://repo.b3p.nl/nexus/repository/npm-public'], path.resolve(__dirname, '../dist/', project))
    })
    .then(() => {
      const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
      availableProjects.forEach(availableProject => {
        const jsonPath = path.resolve(__dirname, '../projects/', availableProject, 'package.json');
        const packageJson = require(jsonPath);
        let madeChanges = false;
        Object.keys(packageJson.peerDependencies).forEach(key => {
          if (key === scope + '/' + project) {
            packageJson.peerDependencies[key] = currentVersion;
            madeChanges = true;
          }
        });
        fs.writeFileSync(jsonPath, JSON.stringify(packageJson, null, 2));
      });
      return Promise.resolve();
    })
    .then(() => runCommand('git', ['add', '-A']))
    .then(() => {
      const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
      const message = `Released version ${currentVersion} of ${project} project`;
      if (dryRun) {
        console.log('Would commit: ' + message + ', but running in dry-run mode');
        return Promise.resolve();
      }
      return Promise.resolve();
      // return runCommand('git', ['commit', '-m', `Released version ${currentVersion} of ${project} project`]);
    })
    .catch(error => {
      console.log('Error occurred: ', error);
    });
};

const project = getCliArgument('--project');
const version = getCliArgument('--version');
const dryRun = hasCliArgument('--dry-run');

if (project) {
  publishRelease(project, version, dryRun);
} else {
  requestProject('Select the project for which to make a release', publishRelease);
}
