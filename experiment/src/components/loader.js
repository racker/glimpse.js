component.loader = function(graph, settings) {
  var instance = graph.instance;
  var g = graph.instance.svg.append('g').attr({ id: settings.id, 'class': 'loader' });
  // add pattern fill and text from settings.
  g.append('rect').attr({
    width: '100%',
    height: '100%',
    fill: 'white',
    'fill-opacity': 0.7,
    stroke: 'black',
    rx: 4,
    ry: 4
  });
  g.append('text').attr('class', 'status').text('Loading...').center();
  return { ele: g, id: settings.id, remove: function() { g.remove(); } };
};
