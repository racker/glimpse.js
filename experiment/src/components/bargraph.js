gl.barGraph = function(graph, settings) {
  var instance = graph.instance, config = graph.config,
      dataSources = graph.dataSources,
      data = gl_arrGetById(dataSources, settings.dataSourceId).data,
      color = settings.color || graph.getColor();
  var xmin = new Date(d3.min(data, config.xAccessor));
  // What should the width be? Fixed? Determined from data?
  var layer = instance.layerGroup.append('g').attr('class', 'layer');
  var bars = layer.selectAll('rect').data(data); //data join on what id?
  bars.enter().append('rect')
     .attr('width', function(d,i) { return instance.x(xmin.getTime()+ (0.7*24*60*60*1000)) - instance.x(xmin.getTime()); })
     .attr('height', function(d,i) { return 0; })
     .attr('x', function(d, i) {
       return instance.x(d.x);
     })
     .attr('y', function(d, i) { return 0; })
     .style('fill', color)
     .style('stroke', color)
     .transition().delay(function (d,i){ return i * 150; })
     .duration(150)
     .attr('y', function(d, i) { return instance.y(d.y); })
     .attr('height', function(d) { return instance.y(0)-instance.y(d.y); });
  bars.exit().remove();

  function update() {
    bars = layer.selectAll('rect').data(data);
    bars
       .attr('x', function(d, i) {
         return instance.x(d.x);
       })
       .attr('y', function(d, i) { return instance.y(d.y); })
       .attr('height', function(d) { return instance.y(0)-instance.y(d.y); });
  }

  function layer() {
  }
  layer.update = function() {
    update();
  };
  layer.settings = function() {
    return settings;
  };
  layer.color = function() {
    return color;
  };
  return layer;
};
