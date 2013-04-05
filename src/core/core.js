// d3-ext is extending d3. Do not remove the require.
define([
  'graphs/graph',
  'graphs/graph-builder',
  'components/component',
  'd3-ext/d3-ext'
],
function(graph, graphBuilder, component) {
  'use strict';

  var core = {
    version: '0.0.2',
    graphBuilder: graphBuilder,
    graph: graph,
    components: component
  };

  return core;
});
