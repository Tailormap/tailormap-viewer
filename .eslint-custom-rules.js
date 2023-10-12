function getInvalidImportsRule(projectName, allowOpenLayers, allowAdmin) {
  const rule = {
    // node packages
    paths: ["assert", "buffer", "child_process", "cluster", "crypto", "dgram", "dns", "domain", "events", "freelist", "fs", "http", "https", "module", "net", "os", "path", "punycode", "querystring", "readline", "repl", "smalloc", "stream", "string_decoder", "sys", "timers", "tls", "tracing", "tty", "url", "util", "vm", "zlib"],
    patterns: [
      // do not allow circular references to own project
      {
        "group": [projectName],
        "message": "Invalid reference to own project"
      },
      {
        "group": ["@angular/localize/init"],
        "message": "Do not import $localize. This is provided by Angular and imported once in polyfills.ts"
      }
    ]
  };
  if (!allowOpenLayers) {
    // in most cases also do not allow imports from OpenLayers directly
    rule.patterns.push({
      "group": ["ol", "ol/*"],
      "message": "Please wrap OpenLayers functionality in map project."
    });
  } else {
    const exceptions = ["!ol/TileState", "!ol/tilegrid", "!ol/render", "!ol/events", "!ol/renderer", "!ol/MapEvent"];
    rule.patterns.push({
      group: ["ol/*", ...exceptions],
      importNames: ["default"],
      message: `Please do not use default imports from OpenLayers (if possible, exceptions are ${exceptions.join(', ').replace(/!/g, '')}), use named imports instead.`
    });
  }
  if (!allowAdmin) {
    // in most cases also do not allow imports from OpenLayers directly
    rule.patterns.push({
      "group": ["@tailormap-admin", "@tailormap-admin/*"],
      "message": "Do not import from admin project."
    });
  }
  return rule;
}

module.exports = {
  getInvalidImportsRule: getInvalidImportsRule
};
