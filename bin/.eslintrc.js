var path = require('path')

module.exports = {
  "extends": path.resolve(__dirname, "../.eslintrc.json"),
  "ignorePatterns": [
    "!**/*",
  ],
  "overrides": [
    {
      "files": [
        "*.js"
      ],
      "parserOptions": {
        "ecmaVersion": 6
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
