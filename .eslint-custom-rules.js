function getInvalidImportsRule(projectName, allowOpenLayers) {
  const rule = {
    // node packages
    paths: ["assert", "buffer", "child_process", "cluster", "crypto", "dgram", "dns", "domain", "events", "freelist", "fs", "http", "https", "module", "net", "os", "path", "punycode", "querystring", "readline", "repl", "smalloc", "stream", "string_decoder", "sys", "timers", "tls", "tracing", "tty", "url", "util", "vm", "zlib"],
    // do not allow circular references to own project
    patterns: [{
      "group": [projectName],
      "message": "Invalid reference to own project"
    }]
  };
  if (!allowOpenLayers) {
    // in most cases also do not allow imports from OpenLayers directly
    rule.patterns.push({
      "group": ["ol", "ol/*"],
      "message": "Please wrap OpenLayers functionality in map project."
    });
  }
  return rule;
}

module.exports = {
  getInvalidImportsRule: getInvalidImportsRule
};
