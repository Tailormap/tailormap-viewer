const path = require('path');
const { runCommand, checkCleanGitRepo, requestProject} = require("./shared");

// checkCleanGitRepo();

const publishRelease = (project, version) => {
  const versionCommand = !!version ? ['version', version] : ['version', 'patch'];
  runCommand('npm', versionCommand, path.resolve(__dirname, '../projects/', project))
    .then(() => runCommand('ng', ['build', project]))
    .then(() => runCommand('npm', ['publish', '--scope=@tailormap-viewer', '--registry=https://repo.b3p.nl/nexus/repository/npm-public'], path.resolve(__dirname, '../dist/', project)))
    .then(() => runCommand('git', ['add', '-A']))
    .then(() => {
      const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
      return runCommand('git', ['commit', '-m', `Released version ${currentVersion} of ${project} project`]);
    });
};

const projectArgIdx = process.argv.findIndex(a => a.indexOf('--project=') !== -1);
const versionArgIdx = process.argv.findIndex(a => a.indexOf('--version=') !== -1);

let project;
let version;

if (projectArgIdx !== -1) {
  project = process.argv[projectArgIdx].replace('--project=', '').toLowerCase();
}
if (versionArgIdx !== -1) {
  version = process.argv[versionArgIdx].replace('--version=', '').toLowerCase();
}

if (project) {
  publishRelease(project, version);
} else {
  requestProject('Select the project for which to make a release', publishRelease);
}
