const {checkCleanGitRepo, runCommand} = require("./shared");
const path = require("path");

const versionArgIdx = process.argv.findIndex(a => a.indexOf('--version=') !== -1);
const version = versionArgIdx !== -1 ? process.argv[versionArgIdx].replace('--version=', '').toLowerCase() : null;

if (version === null) {
  console.error('Supply version');
  process.exit(1);
}

// checkCleanGitRepo();

const projects = ['api', 'shared', 'map', 'core'];
(async function main() {
  for (const project of projects) {
    await runCommand('node', ['bin/publish-new-release.js', '--project=' + project, '--version=' + version]);
  }
  await runCommand('git', ['tag', version], path.resolve(__dirname, '../'));
})();


