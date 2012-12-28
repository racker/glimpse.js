define([
  'd3',
  'core/chart',
  'core/component/axis',
  'core/component/legend',
  'core/component/bar',
  'core/component/line',
  'core/component/scatter'
],
function (d3, chart, axis, legend, bar, line, scatter) {
  'use strict';

  var core = {

    version: '0.0.1',

    chart: chart,

    component: function (type) {
      // TODO: lazy load these
      switch (type) {
        case 'bar':
          return bar.new();
        case 'line':
          return line.new();
        case 'axis':
          return axis.new();
        case 'legend':
          return legend.new();
        case 'scatter':
          return scatter.new();
      }
    }

  };

  return core;
});
