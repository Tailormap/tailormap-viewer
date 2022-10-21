const { spawn, execSync } = require('child_process');
const path = require('path');
const inquirer = require('inquirer');

const availableProjects = ['api', 'shared', 'map', 'core'];

const getCliArgument = (varName) => {
  const cliArgIdx = process.argv.findIndex(a => a.indexOf(varName) !== -1);
  return cliArgIdx !== -1 ? process.argv[cliArgIdx].replace(varName, '').toLowerCase() : null;
}

const hasCliArgument = (varName) => {
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

exports.requestProject = requestProject;
exports.checkCleanGitRepo = checkCleanGitRepo;
exports.runCommand = runCommand;
exports.availableProjects = availableProjects;
exports.getCliArgument = getCliArgument;
exports.hasCliArgument = hasCliArgument;
