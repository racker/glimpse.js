define([
  'components/line',
  'components/legend',
  'components/axis',
  'components/label',
  'components/overlay',
  'components/asset',
  'components/area',
  'components/scatter',
  'components/tooltip'
],
function(line, legend, axis, label, overlay, asset, area, scatter, tooltip) {
  'use strict';

  return {
    line: line,
    legend: legend,
    axis: axis,
    label: label,
    overlay: overlay,
    asset: asset,
    area: area,
    scatter: scatter,
    tooltip: tooltip
  };

});
