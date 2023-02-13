
const useLocalhost = process.env.PROXY_USE_LOCALHOST === 'true';

module.exports = {
  "/api/*":{
    "target": useLocalhost ? "http://127.0.0.1:8080" : "https://snapshot.tailormap.nl",
    "secure": false,
    "logLevel": "info",
    "headers": useLocalhost ? {} : {
      // Send HTTP Host request header for name-based virtual host
      "Host": "snapshot.tailormap.nl"
    },
    onProxyRes(proxyRes) {
      if(proxyRes.headers['location']) {
        // Rewrite the Location response header for redirects on login/logout (like the Apache ProxyPassReverse directive)
        proxyRes.headers['location'] = proxyRes.headers['location'].replace('https://snapshot.tailormap.nl', 'http://localhost:4200');
      }
    },
  }
};
