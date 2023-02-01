const chalk = require('chalk');
const git = require('git-describe');
const path = require('path');
const fs = require('fs');

const {version: appVersion} = require('../projects/core/package.json');

const info = git.gitDescribeSync({longSemver: true, customArguments: [ '--abbrev=40' ]});
fs.mkdir(path.join(__dirname, '../generated/'), { recursive: true }, (err) => {
  if (err) throw err;
});
const file = path.resolve(__dirname, '../generated/', 'version.json');

const version = JSON.stringify({version: appVersion, buildDate: Date(), gitInfo: info}, null, 2);

fs.writeFile(file, version, {encoding: 'utf-8'}, (err) => {
  if (err) throw err;
  console.log(chalk.green(`Wrote version info ${appVersion}, ${info.raw} to ${path.relative(path.resolve(__dirname, '..'), file)}`));
});
