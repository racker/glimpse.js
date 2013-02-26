require.config({
  baseUrl: '../src',
  paths: {
    'd3':   '../components/d3/d3'
  },
  shim: {
    'd3': {
      exports: 'd3'
    }
  }
});
