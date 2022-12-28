const {checkCleanGitRepo, publishRelease, requestVersion, runCommand, availableProjects, getCliArgument, hasCliArgument} = require("./shared");
const path = require("path");

checkCleanGitRepo();

(async function main() {
  let version = getCliArgument('--version');
  const dryRun = hasCliArgument('--dry-run');

  if (version === null) {
    version = await requestVersion()
  }

  if (!version) {
    console.error('Supply version');
    process.exit(1);
  }

  try {
    await runCommand('rm', ['-rf', 'dist'], path.resolve(__dirname, '../'));
    for (const project of availableProjects) {
      await publishRelease(project, version, dryRun);
    }
    const tagVersion = version.startsWith('v') ? version : `v${version}`;
    await runCommand('git', ['tag', tagVersion], path.resolve(__dirname, '../'));
  } catch (e) {
    console.log('Error occurred: ', e);
  }
})();


