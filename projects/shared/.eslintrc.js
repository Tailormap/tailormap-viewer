var path = require('path')

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
      "rules": {}
    },
    {
      "files": [
        "*.html"
      ],
      "rules": {}
    }
  ]
}
