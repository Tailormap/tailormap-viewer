const path = require('path');
const { getInvalidImportsRule } = require("../../.eslint-custom-rules");

module.exports = {
  "extends": path.resolve(__dirname, "../../.eslintrc.json"),
  "ignorePatterns": [
    "!**/*",
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "parserOptions": {
        "project": [
          "tsconfig.lib.json",
          "tsconfig.spec.json"
        ],
        "createDefaultProgram": true,
        "tsconfigRootDir": __dirname
      },
      "rules": {
        "rxjs/finnish": 0,
        "no-restricted-imports": ["error", getInvalidImportsRule("@tailormap-viewer/map", true)]
      }
    },
    {
      "files": [
        "*.html"
      ],
      "rules": {}
    }
  ]
}
