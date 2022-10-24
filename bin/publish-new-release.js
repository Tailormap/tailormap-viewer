const { checkCleanGitRepo, requestProject, getCliArgument, hasCliArgument, publishRelease} = require("./shared");

checkCleanGitRepo();

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
