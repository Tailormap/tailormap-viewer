const chalk = require('chalk');
const git = require('git-describe');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const {version: appVersion} = require('../projects/core/package.json');

try {
  const info = git.gitDescribeSync({longSemver: true, customArguments: ['--abbrev=40']});
  fs.mkdirSync(path.join(__dirname, '../generated/'), {recursive: true});
  const file = path.resolve(__dirname, '../generated/', 'version.json');

  const version = JSON.stringify({version: appVersion, buildDate: Date(), gitInfo: info}, null, 2);

  fs.writeFileSync(file, version, {encoding: 'utf-8'});
  console.log(chalk.green(`Wrote version info ${appVersion}, ${info.raw} to ${path.relative(path.resolve(__dirname, '..'), file)}`));
} catch(e) {
  console.log(chalk.red('Error writing version and git info'), e);
}

try {
  execSync('cd projects/core/src/lib/map/bookmark && npx buf generate');
  console.log(chalk.green('Generated protobuf typescript file for bookmark'));
} catch(e) {
  console.log(chalk.red('Error generating protobuf typescript file for bookmark'), e);
}
