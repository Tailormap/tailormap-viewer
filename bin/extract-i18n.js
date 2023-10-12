const {runCommand} = require("./shared");
const path = require("path");

(async function main() {
  try {
    await runCommand('rm', ['-rf', 'dist'], path.resolve(__dirname, '../'));
    await runCommand('rm', ['-rf', '.angular'], path.resolve(__dirname, '../'));
    for (const project of ['shared', 'admin-core', 'core']) {
      await runCommand('ng', ['extract-i18n', `--configuration=${project}`], path.resolve(__dirname, '../'));
    }
  } catch (e) {
    console.log('Error occurred: ', e);
  }
})();


