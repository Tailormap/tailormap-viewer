const {runCommand, getCliArgument} = require("./shared");
const path = require("path");
const fs = require("fs/promises");
const {readdirSync} = require("fs");

const singleProject = getCliArgument('--project');
const getDirectories = source => {
  return readdirSync(source, {withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
};
const availableProjects = getDirectories(path.resolve(__dirname, '../projects'));
const angularJsonPath = path.resolve(__dirname, '../angular.json');
const angularJsonBackupPath = path.resolve(__dirname, '../angular.json.orig');

const addTemporaryConfiguration = async (project) => {
  const removeIdsWithPrefix = availableProjects
    .filter(t => t !== project)
    .map(p => `${p}.`);
  const configuration = {
    "outputPath": `projects/${project}/assets/locale`,
    "removeIdsWithPrefix": removeIdsWithPrefix,
    "sourceFile": `messages.${project}.en.xlf`,
    "targetFiles": [`messages.${project}.nl.xlf`]
  };
  try {
    await fs.copyFile(angularJsonPath, angularJsonBackupPath);
    const angularJsonContents = JSON.parse((await fs.readFile(angularJsonPath)).toString());
    angularJsonContents['projects']['app']['architect']['extract-i18n']['configurations'][project] = configuration;
    await fs.writeFile(angularJsonPath, JSON.stringify(angularJsonContents));
  } catch (e) {
    console.error('Could not make backup of angular.json');
  }
}

const cleanupTemporaryConfiguration = async () => {
  try {
    await fs.rm(angularJsonPath);
    await fs.copyFile(angularJsonBackupPath, angularJsonPath);
    await fs.rm(angularJsonBackupPath);
  } catch (e) {
    console.error('Could revert changes to angular.json, please check manually');
  }
}

(async function main() {
  try {
    await runCommand('rm', ['-rf', 'dist'], path.resolve(__dirname, '../'));
    await runCommand('rm', ['-rf', '.angular'], path.resolve(__dirname, '../'));
    const projects = singleProject && availableProjects.includes(singleProject)
      ? [singleProject]
      : availableProjects;
    for (const project of projects) {
      await addTemporaryConfiguration(project);
      await runCommand('ng', ['extract-i18n', `--configuration=${project}`], path.resolve(__dirname, '../'));
      await cleanupTemporaryConfiguration();
    }
  } catch (e) {
    console.log('Error occurred: ', e);
  }
})();


