
module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    browsers: ['firefox_web_components'],
    files: [
      'test/unit/setup.js',
      'bower_components/gaia-component-utils/index.js',
      'script.js',
      'test/unit/test.js',
      { pattern: 'style.css', included: false }
    ],
    proxies: { '/': 'http://localhost:9876/base/' },
    reporters: ['dots'],
    urlRoot: '/karma/',
    client: {
      mocha: { ui: 'tdd' }
    },
    customLaunchers: {
      firefox_web_components: {
        base: 'FirefoxNightly',
        prefs: {
          'dom.webcomponents.enabled': true
        }
      }
    }
  });
};
