const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

function getPackageVersion(packageName) {
  try {
    return require('../node_modules/' + packageName + '/package.json').version;
  } catch(error) {
    return undefined;
  }
}

function getAddedPackagesWithVersion() {
  try {
    const packages = require('../added-packages.json');
    return packages.map(packageName => {
      return { name: packageName, version: getPackageVersion(packageName) };
    });
  } catch(error) {
    return [];
  }
}

try {
  const file = path.resolve(__dirname, '../dist/app/', 'version.json');
  const appVersion = getPackageVersion('@tailormap-viewer/core');
  const version = JSON.stringify({
    version: appVersion,
    buildDate: Date(),
    addedPackages: getAddedPackagesWithVersion()}, null, 2);
  fs.writeFileSync(file, version, {encoding: 'utf-8'});
  console.log(chalk.green(`Wrote version info ${appVersion} to ${path.relative(path.resolve(__dirname, '..'), file)}`));
} catch(e) {
  console.log(chalk.red('Error writing version and git info'), e);
}
