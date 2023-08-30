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

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  try {
    await runCommand('rm', ['-rf', 'dist'], path.resolve(__dirname, '../'));
    for (const project of availableProjects) {
      await publishRelease(project, version, dryRun);
      await sleep(5000);
    }
    const tagVersion = version.startsWith('v') ? version : `v${version}`;
    await runCommand('git', ['tag', tagVersion], path.resolve(__dirname, '../'));
  } catch (e) {
    console.log('Error occurred: ', e);
  }
})();


