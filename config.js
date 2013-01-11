require.config({
  baseUrl: '../src',
  paths: {
    'd3':   '../lib/d3'
  },
  shim: {
    'd3': {
      exports: 'd3'
    }
  }
});
