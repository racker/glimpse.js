var tests = Object.keys(window.__testacular__.files).filter(function (file) {
  'use strict';
  return (/\.spec\.js$/).test(file);
});

require({
  baseUrl: '/base/src',
  paths: {
    require: '../components/requirejs/require',
    d3:   '../components/d3/d3',
    'test-util': '../test/util'
  },
  shim: {
    'd3': { exports: 'd3' }
  }
}, tests, function() {
  'use strict';
  window.__testacular__.start();
});
