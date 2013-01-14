component.legend = function(graph, settings) {
  var instance = graph.instance, config = graph.config,
                 x = 0, y = 0,
                 layers = instance.layers,
                 g, i, dataSource, bbox;
  var legend = instance.svg.append('g').attr('transform', 'translate(45,30)')
               .attr('class', 'legend');
  for (i = 0; i < layers.length; i++) {
    //dataSource = gl_arrGetById(graph.dataSources, layers[i].dataSourceId);
    g = legend.append('g').attr('transform', 'translate(' + [x, 0] +')');
    g.append('circle').style('stroke-width', '2px').style('fill', layers[i].color()).attr('r', 5)
    g.append('text').attr('text-anchor', 'start').attr('dy', '0.32em').attr('dx', 8).text(layers[i].settings().dataSourceId);
    bbox = g.node().getBBox();
    x += bbox.width + 10;
    y += bbox.height;
  }
};
