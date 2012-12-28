define([
  'd3',
  'core/chart',
  'core/component/axis',
  'core/component/legend',
  'core/component/bar',
  'core/component/line'
],
function (d3, chart, axis, legend, bar, line) {
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
      }
    }

  };

  return core;
});
