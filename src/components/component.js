define([
  'components/line',
  'components/legend',
  'components/axis',
  'components/label'
],
function(line, legend, axis, label) {
  'use strict';

  return {
    line: line,
    legend: legend,
    axis: axis,
    label: label
  };

});
