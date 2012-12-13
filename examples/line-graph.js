define(['glimpse'], function (glimpse) {
  'use strict';

  // Modules: axes, legend, tooltip, layers

  // Config: separate from instaces, but instance config is overwriteable

  // Layer/Renderer types: point(scatter plot), line, bar, area

  // Ideas:
  //   implicit data mappings if not defined?
  //   data formats supported?
  //   first create a "context" obj, could manage cross-graph stuff?

  var data, myChart, instance1, instance2;

  data = [
    {
      label: 'series 1',
      data: [{x: 1, y: 1}, {x: 2, y: 5}]
    },
    {
      label: 'series 2',
      data: [{x: 1, y: 2}, {x: 2, y: 6}]
    }
  ];

  myChart = glimpse.chart.create()
    .config('title', 'base graph')
    .config('width', 400)
    .config('height', 10)
    .config('bgColor', '#ccc');
  // this would also work on the base chart:
  // myChart.render('#container');


  instance1 = myChart.create();
  instance1
    .config('height', 300)
    .config('title', 'child graph')
    .data(data)
    .layer(
        glimpse.layer.create('bar')
          .config('dataAccessor', function (d) { return d.data; })
          .config('fill', 'steelBlue')
          .config('x', function (d) { return d.x; })
          .config('y', function (d) { return d.y; })
    )
    .render('#container');

});
