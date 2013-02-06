// d3-ext is extending d3. Do not remove the require.
define([
  'graphs/graph',
  'components/component',
  'd3-ext/d3-ext'
],
function (graph, component) {
  'use strict';

  var core = {
    version: '0.0.1',
    graph: graph,
    components: component
  };

  return core;
});
