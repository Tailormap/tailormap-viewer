const { spawn, execSync } = require('child_process');
const path = require('path');
const inquirer = require('inquirer');
const fs = require("fs");

const scope = '@tailormap-viewer';
const availableProjects = ['api', 'shared', 'map', 'core'];

const getCliArgument = (varName) => {
  const cliArgIdx = process.argv.findIndex(a => a.indexOf(varName) !== -1);
  return cliArgIdx !== -1 ? process.argv[cliArgIdx].substring(varName.length + 1).toLowerCase() : null;
}

const hasCliArgument = (varName) => {
  console.log('Checking for argument', varName, process.argv.findIndex(a => a.indexOf(varName) !== -1), process.argv);
  return process.argv.findIndex(a => a.indexOf(varName) !== -1) !== -1;
};

const checkCleanGitRepo = () => {
  const gitStatus = execSync('git status --short').toString();
  const gitDirty = gitStatus !== '';
  if (gitDirty) {
    console.error('Git repository is dirty, please commit first before making a new release');
    process.exit();
  }
};

const requestProject = (message, callback) => {
  inquirer.prompt([{
    type: 'list',
    name: 'project',
    message: message,
    choices: availableProjects,
  }])
    .then(answers => {
      const project = answers.project;
      if (!project) {
        console.error('Please select a project');
        process.exit();
      }
      callback(project);
    });
};

async function requestVersion(message) {
  const answers = await inquirer.prompt([{
    type: 'input',
    name: 'version',
    message: 'What version do you want to release (e.g. 10.0.0-rc2)',
    validate: function(value) {
      const versionRegex = new RegExp('^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$');
      if (!versionRegex.test(value)) {
        return 'Please provide a valid version (for example 10.0.0 or 10.0.0-rc2)';
      }
      return true;
    }
  }]);
  return answers.version;
}

const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      cwd: cwd || path.resolve(__dirname, '../')
    });
    cmd.on('error', err => {
      console.error(err);
      reject();
    });
    cmd.on('close', (code) => {
      resolve();
    });
  });
};

function updatePeerDependencies(project) {
  const currentVersion = require(path.resolve(__dirname, '../projects/', project, 'package.json')).version
  availableProjects.forEach(availableProject => {
    const jsonPath = path.resolve(__dirname, '../projects/', availableProject, 'package.json');
    const packageJson = require(jsonPath);
    let madeChanges = false;
    Object.keys(packageJson.peerDependencies).forEach(key => {
      if (key === scope + '/' + project) {
        packageJson.peerDependencies[key] = `^${currentVersion}`;
        madeChanges = true;
      }
    });
    fs.writeFileSync(jsonPath, JSON.stringify(packageJson, null, 2));
  });
}

async function publishRelease(project, version, dryRun) {
  console.log(`Publishing release for ${project}. Supplied version: ${version}. Dry-run: ${dryRun ? 'true' : 'false'}`);
  const npmVersion = version.startsWith('v') ? version.substring(1) : version;
  const versionCommand = !!version ? ['version', npmVersion] : ['version', 'patch'];
  await runCommand('npm', versionCommand, path.resolve(__dirname, '../projects/', project));
  await runCommand('ng', ['build', project]);
  if (dryRun) {
    console.log('Would publish ' + project + ' to https://repo.b3p.nl/nexus/repository/npm-public, but running in dry-run mode');
  } else {
    await runCommand('npm', ['publish', '--scope=' + scope, '--registry=https://repo.b3p.nl/nexus/repository/npm-public'], path.resolve(__dirname, '../dist/', project));
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
    await runCommand('git', ['commit', '-m', `Released version ${currentVersion} of ${project} project`])
  }
}

exports.requestProject = requestProject;
exports.requestVersion = requestVersion;
exports.checkCleanGitRepo = checkCleanGitRepo;
exports.runCommand = runCommand;
exports.availableProjects = availableProjects;
exports.getCliArgument = getCliArgument;
exports.hasCliArgument = hasCliArgument;
exports.publishRelease = publishRelease;
