module.exports = function(config) {
  config.set({
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
    browsers: ['Chrome'],
    singleRun: false,
    reportSlowerThan: 500,
    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher'
    ]
  });
};
