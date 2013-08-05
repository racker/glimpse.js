// d3-ext is extending d3. Do not remove the require.
define([
  'core/object',
  'core/string',
  'core/array',
  'core/function',
  'core/format',
  'data/selection/selection',
  'data/dimension/dimension',
  'graphs/graph',
  'layout/layouts',
  'graphs/graph-builder',
  'components/component',
  'data/collection',
  'core/asset-loader',
  'events/pubsub',

  'd3-ext/d3-ext'
],
function(obj, string, array, fn, format, selection, dimension, graph,
    layouts, graphBuilder, component, collection, assets, pubsub) {
  'use strict';

  var core = {
    version: '0.0.11',
    obj: obj,
    string: string,
    array: array,
    fn: fn,
    format: format,
    graphBuilder: graphBuilder,
    graph: graph,
    layouts: layouts,
    components: component,
    data: {
      selection: selection,
      dimension: dimension
    },
    dataCollection: collection,
    assetLoader: assets,
    pubsub: pubsub,
    // Singleton pubsub instance global to everything.
    globalPubsub: pubsub.getSingleton()
  };

  return core;
});
