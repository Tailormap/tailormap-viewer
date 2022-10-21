const {checkCleanGitRepo, runCommand, availableProjects, getCliArgument} = require("./shared");
const path = require("path");

const version = getCliArgument('--version');
const dryRun = getCliArgument('--dry-run');

if (version === null) {
  console.error('Supply version');
  process.exit(1);
}

checkCleanGitRepo();

(async function main() {
  for (const project of availableProjects) {
    const args = ['bin/publish-new-release.js', '--project=' + project, '--version=' + version];
    if (dryRun) {
      args.push('--dry-run');
    }
    await runCommand('node', args) || process.exit(1);
  }
  await runCommand('git', ['tag', version], path.resolve(__dirname, '../'));
})();


