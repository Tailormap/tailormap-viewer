const { execSync } = require('child_process');
const chalk = require('chalk');

try {
  execSync('cd projects/core/src/lib/map/bookmark && npx buf generate');
  console.log(chalk.green('Generated protobuf typescript file for bookmark'));
} catch(e) {
  console.log(chalk.red('Error generating protobuf typescript file for bookmark'), e);
}
