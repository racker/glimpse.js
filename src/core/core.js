// d3-ext is extending d3. Do not remove the require.
define([
  'graphs/graph',
  'graphs/graph-builder',
  'components/component',
  'data/collection',
  'core/asset-loader',
  'events/pubsub',

  'd3-ext/d3-ext'
],
function(graph, graphBuilder, component, collection, assets, pubsub) {
  'use strict';

  var core = {
    version: '0.0.4',
    graphBuilder: graphBuilder,
    graph: graph,
    components: component,
    dataCollection: collection,
    assetLoader: assets,
    pubsub: pubsub,
    // Singleton pubsub instance global to everything.
    globalPubsub: pubsub.getSingleton()
  };

  return core;
});
