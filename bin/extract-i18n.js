const {runCommand, getCliArgument} = require("./shared");
const path = require("path");

const singleProject = getCliArgument('--project');

(async function main() {
  try {
    await runCommand('rm', ['-rf', 'dist'], path.resolve(__dirname, '../'));
    await runCommand('rm', ['-rf', '.angular'], path.resolve(__dirname, '../'));
    const translatableProjects = ['shared', 'admin-core', 'core'];
    const projects = singleProject && translatableProjects.includes(singleProject)
      ? [singleProject]
      : translatableProjects;
    for (const project of projects) {
      await runCommand('ng', ['extract-i18n', `--configuration=${project}`], path.resolve(__dirname, '../'));
    }
  } catch (e) {
    console.log('Error occurred: ', e);
  }
})();


