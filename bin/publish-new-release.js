const path = require('path');
const { runCommand, checkCleanGitRepo, requestProject, availableProjects, getCliArgument, hasCliArgument} = require("./shared");
const fs = require("fs");

checkCleanGitRepo();

const scope = '@tailormap-viewer';

function updatePeerDependencies(project) {
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
}

async function publishRelease(project, version, dryRun) {
  const versionCommand = !!version ? ['version', version] : ['version', 'patch'];
  await runCommand('npm', versionCommand, path.resolve(__dirname, '../projects/', project));
  await runCommand('ng', ['build', project]);
  if (dryRun) {
    console.log('Would publish ' + project + ' to https://repo.b3p.nl/nexus/repository/npm-public, but running in dry-run mode');
  } else {
    // await runCommand('npm', ['publish', '--scope=' + scope, '--registry=https://repo.b3p.nl/nexus/repository/npm-public'], path.resolve(__dirname, '../dist/', project));
  }
  updatePeerDependencies(project);
  if (dryRun) {
    console.log('Would add all changed files to Git, but running in dry-run mode');
  } else {
    await runCommand('git', ['add', '-A']);
  }
  const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
  const message = `Released version ${currentVersion} of ${project} project`;
  if (dryRun) {
    console.log('Would commit: ' + message + ', but running in dry-run mode');
  } else {
    // await runCommand('git', ['commit', '-m', `Released version ${currentVersion} of ${project} project`])
  }
}

const project = getCliArgument('--project');
const version = getCliArgument('--version');
const dryRun = hasCliArgument('--dry-run');

if (project) {
  try {
    publishRelease(project, version, dryRun);
  } catch (e) {
    console.log('Error occured', e);
  }
} else {
  requestProject('Select the project for which to make a release', publishRelease);
}
