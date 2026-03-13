module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    "node_modules/(?!@exodus/bytes|html-encoding-sniffer|jsdom|whatwg-url|iconv-lite)"
  ]
};
