// d3-ext is extending d3. Do not remove the require.
define([
  'graphs/graph',
  'graphs/graph-builder',
  'components/component',
  'data/collection',
  'core/asset-loader',
  'd3-ext/d3-ext'
],
function(graph, graphBuilder, component, collection, assets) {
  'use strict';

  var core = {
    version: '0.0.3',
    graphBuilder: graphBuilder,
    graph: graph,
    components: component,
    dataCollection: collection,
    assetLoader :assets
  };

  return core;
});
