const { execSync } = require('child_process');
const { styleText} = require("node:util");

try {
  execSync('cd projects/core/src/lib/services/application-bookmark && npx buf generate');
  console.log(styleText('green', 'Generated protobuf typescript file for bookmark'));
} catch(e) {
  console.log(styleText('red', 'Error generating protobuf typescript file for bookmark'), e);
}
