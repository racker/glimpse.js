define(['glimpse'], function (glimpse) {
  'use strict';

  var chart,
      data = datasets;

  chart = glimpse.chart.new();

  chart
    .config({
      'title': 'simple line chart',
      'width': 800,
      'height': 400
    })
    .data({
      'series1': data[0].data
    })
    .component(
      glimpse.component('line')
        .config({
          'id': 'avg1',
          'label': 'avgerage',
          'dataId': 'series1',
          'color': 'steelblue',
          'fillArea': true,
          'x': function (d) { return d.timestamp; },
          'y': function (d) { return d.average; }
        })
    )
  .render('#container');

  // make global for easy console access
  window.chart = chart;
});
