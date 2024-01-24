const path = require('path');
const fs = require('fs');

function getPackageVersion(subFolder, packageName) {
  try {
    return ;
  } catch(error) {
    return undefined;
  }
}

try {
  const file = path.resolve(__dirname, '../dist/app/', 'version.json');
  const appVersion = require(path.resolve(__dirname, '../projects/core', 'package.json')).version
  const versionInfo = {
    version: appVersion,
    buildDate: Date(),
    addedPackages: []
  };
  const version = JSON.stringify(versionInfo, null, 2);
  fs.writeFileSync(file, version, {encoding: 'utf-8'});
  console.log(`Wrote version info ${appVersion} to ${path.relative(path.resolve(__dirname, '..'), file)}`);
} catch(e) {
  console.log('Error writing version and git info', e);
}
