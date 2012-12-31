define(['glimpse'], function (glimpse) {
  'use strict';

  var chart,
      data = datasets;

  chart = glimpse.chart.new();

  chart
    .config({
      'title': 'simple line chart',
      'width': 800,
      'height': 400,
      'axesVisible': 'hover'
    })
    .data({
      'series1': data[0].data,
      'series2': data[1].data
    })
    .component(
      glimpse.component('line')
        .config({
          'id': 'avg1',
          'label': 'avgerage one',
          'dataId': 'series1',
          'color': 'steelblue',
          'x': function (d) { return d.timestamp; },
          'y': function (d) { return d.average; }
        })
    )
    .component(
      glimpse.component('line')
        .config({
          'id': 'avg2',
          'label': 'avgerage two',
          'dataId': 'series2',
          'color': '#bada55',
          'x': function (d) { return d.timestamp; },
          'y': function (d) { return d.average; }
        })
    )
  .render('#container');

  // make global for easy console access
  window.chart = chart;
});
