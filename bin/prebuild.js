const chalk = require('chalk');
const git = require('git-describe');
const path = require('path');
const fs = require('fs-extra');
const {version: appVersion} = require('../package.json')

const info = git.gitDescribeSync({longSemver: true, customArguments: [ '--abbrev=40' ]});
fs.mkdirp(path.join(__dirname, '../generated/'));
const file = path.resolve(__dirname, '../generated/', 'version.json');

fs.writeFileSync(file, JSON.stringify({version: appVersion, buildDate: Date(), gitInfo: info}), {encoding: 'utf-8'});

console.log(chalk.green(`Wrote version info ${appVersion}, ${info.raw} to ${path.relative(path.resolve(__dirname, '..'), file)}`));
