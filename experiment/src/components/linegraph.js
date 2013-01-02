//TODO: Data Renderer interface. Takes settings and data.
//Line graph can take area = true setting.
gl.lineGraph = function(graph, settings) {
  var instance = graph.instance, config = graph.config,
      dataSources = graph.dataSources,
      data = gl_arrGetById(dataSources, settings.dataSourceId).data;
  var color = settings.color || graph.getColor();
  var line = d3.svg.line()
      //.interpolate('basis')
      .x(function(d, i) { return instance.x(d.x); })
      .y(function(d, i) { return instance.y(d.y); });
  //should be get next layer
  var layer = instance.layerGroup.append('g').attr('class', 'layer');
  layer.select('.line').remove();
  var xDomain = instance.x.domain(), yDomain = instance.y.domain(), samplePoints = [], i, diff, base;
  base = xDomain[0].getTime();
  diff = (xDomain[1].getTime() - base)/(data.length - 1);
  for ( i = 0; i < data.length; i++) {
    samplePoints.push({x: base + (i * diff), y: 0})
  }
  var lines = layer.append('path')
    .attr('class', 'line')
    .attr('stroke', color)
    .attr('stroke-width', 4)
    .attr('fill', 'none')
    .attr('d', line(samplePoints))
    .transition()
    .duration(1000)
    .attr('d', line(data));
  var area = d3.svg.area()
    .x(line.x())
    .y1(line.y())
    .y0(instance.y(0));
  layer.select('.area').remove();
  layer.append('path')
    .attr('class', 'area')
    .attr('fill', color)
    .attr('fill-opacity', 0.1)
    .attr('d', area(samplePoints))
    .transition()
    .duration(1000)
    .attr('d', area(data));
  var djLayer = layer.append('g').attr('class', 'dj');
  function dj(djdata) {
    var dj = djLayer
      .selectAll('circle')
      .data(djdata);
    dj.enter()
      .append('circle')
      .attr({
        r: 4,
        stroke: 'white',
        'stroke-width': 2,
        fill: color,
        cx: function(d) { return instance.x(d.x); },
        cy: function(d) { return instance.y(d.y); }
      });
    dj.transition()
      .duration(1000)
      .attr({
        cx: function(d) { return instance.x(d.x); },
        cy: function(d) { return instance.y(d.y); }
      });
  }
  dj(samplePoints);
  dj(data);
  function update() {
    data = gl_arrGetById(dataSources, settings.dataSourceId).data;
    layer.select('.line')
      .attr('stroke', color)
      .attr('stroke-width', 4)
      .attr('fill', 'none')
      .attr('d', line(data));
    area = d3.svg.area()
      .x(line.x())
      .y1(line.y())
      .y0(instance.y(0));
    layer.select('.area')
      .attr('fill', color)
      .attr('fill-opacity', 0.1)
      .attr('d', area(data));
    djLayer
      .selectAll('circle').data(data).attr({
        cx: function(d) { return instance.x(d.x); },
        cy: function(d) { return instance.y(d.y); }
      });
  }
  function layer() {
  }
  layer.update = function() {
    update();
  }
  layer.settings = function() {
    return settings;
  };
  layer.color = function() {
    return color;
  };
  return layer;
};
