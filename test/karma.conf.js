module.exports = function(config) {
  config.set({
    sauceLabs: {
      username: 'glimpsejs',
      //TODO: Invalidate this api key and encrypt a new one for use in travis.
      accessKey: 'd412a4e0-b8bc-4f6c-959a-f5a507e948a9',
      startConnect: true,
      testName: 'Glimpse.js Unit Tests'
    },

    // define SL browsers
    customLaunchers: {
      sl_chrome_linux: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '9',
        platform: 'Windows 7'
      }
    },

    basePath: '../',
    frameworks: ['jasmine', 'requirejs'],
    files: [
      'components/d3/d3.js',
      { pattern: 'src/**/*.js', included: false },
      { pattern: 'src/*.js', included: false },
      { pattern: 'test/unit/*.spec.js', included: false },
      { pattern: 'test/unit/**/*.spec.js', included: false },
      { pattern: 'test/util/*.js', included: false },
      'test/matchers.js',
      'test/fixtures.js',
      'test/testrunner.js'
    ],
    exclude: [],
    reporters: ['progress'],
    port: 9876,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['sl_chrome_linux'],
    singleRun: false,
    reportSlowerThan: 500,
    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-sauce-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher'
    ]
  });
};
