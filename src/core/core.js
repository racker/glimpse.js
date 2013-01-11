define([
  'graphs/graph',
  'components/component'
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
