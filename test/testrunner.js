var tests = Object.keys(window.__testacular__.files).filter(function (file) {
  'use strict';
  return (/\.spec\.js$/).test(file);
});

require({
  baseUrl: '/base/src',
  paths: {
    require: '../lib/require',
    text: '../lib/text',
    d3:   '../lib/d3'
  },
  shim: {
    'd3': { exports: 'd3' }
  }
}, tests, function() {
  'use strict';
  window.__testacular__.start();
});
