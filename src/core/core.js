define([
  'd3',
  'obj/obj',
  'core/chart',
  'core/layer/layer_factory'
],
function (d3, obj, chart, layerFactory) {
  'use strict';

  var core = {

    version: '0.0.1',

    chart: chart,

    layer: layerFactory

  };

  return core;
});
