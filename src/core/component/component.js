define([
  'core/component/line-chart',
  'core/component/bar-chart',
  'core/component/scatter-chart',
  'core/component/legend'
],
function (lineChart, barChart, scatterChart, legend) {
  'use strict';

  return {
    areaChart: lineChart,
    lineChart: lineChart,
    barChart: barChart,
    scatterChart: scatterChart,
    legend: legend
  };

});
