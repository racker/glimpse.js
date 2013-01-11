define(['glimpse'], function (glimpse) {
  'use strict';

  var chart,
      data = datasets;

  chart = glimpse.chart()
    .config({
      'title': 'simple bar graph',
      'width': 800,
      'height': 400
    })
    .data({
      'series1': data[0].data,
      'series2': data[1].data
    })
    .component(
      glimpse.component.scatterChart()
        .config({
          'id': 'avg1',
          'label': 'avgerage 1',
          'dataId': 'series1',
          'color': '#bada55',
          'x': function (d) { return d.timestamp; },
          'y': function (d) { return d.average; }
        })
    )
    .component(
      glimpse.component.scatterChart()
        .config({
          'id': 'avg2',
          'label': 'average 2',
          'dataId': 'series2',
          'color': 'steelblue',
          'x': function (d) { return d.timestamp; },
          'y': function (d) { return d.average; }
        })
    )
  .render('#container');

  // make global for easy console access
  window.chart = chart;
});
