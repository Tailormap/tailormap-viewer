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
          "tsconfig.(app|lib|spec).json",
          "projects/admin-core/tsconfig.(app|lib|spec).json"
        ],
        "createDefaultProgram": true,
        "tsconfigRootDir": __dirname
      },
      "rules": {
        "no-restricted-imports": ["error", getInvalidImportsRule("@tailormap-admin/admin-core", false, true)]
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
