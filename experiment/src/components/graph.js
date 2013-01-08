gl.render = function(graph) {
  var config = graph.config,
      instance = graph.instance,
      dataSources = graph.dataSources,
      ele = d3.select(instance.ele),
      svg;
  instance.id = 'gl-' + gl_randomString();
  svg = instance.svg = ele.append('svg')
        .attr({'width':  '100%',
               'height': '100%',
               'id': instance.id,
               'viewBox': gl_strSubs('0 0 %s %s', config.width, config.height),
               'preserveAspectRatio': 'xMinYMin meet'});
  instance.defs = svg.append('defs');
  instance.style = svg.append('style').attr('type', 'text/css')
                      .text(gl_strTemplate(config.style, {id: '#' + instance.id}));
  instance.xy = svg.append('g').attr('class', 'xy')
                   .attr('transform', 'translate(' + config.padding.left + ',' + config.padding.top + ')');
  // Add clip
  instance.xy.append('svg:clipPath').attr('id', instance.id + '-xyclip')
    .append('rect').attr({ width: instance.width, height: instance.height, opacity: 0 })
  instance.axisPlane = instance.xy.append('g').attr('class', 'axis-plane');
  instance.layerGroup = instance.xy.append('g').attr({ 'class': 'layers', 'clip-path': gl_strSubs('url(#%s)', instance.id + '-xyclip') });
  gl.redraw(graph);
  gl.processRenderQueue(graph);
  if (config.zoom) {
    instance.zoomPan = instance.xy.append('rect').attr('class', 'zoom-pan')
                          .attr({ width: instance.width, height: instance.height, opacity: 0, 'pointer-events': 'all'})
    instance.zoomPan.attr('class', 'gl-event-zoom')
      .call(d3.behavior.zoom().x(instance.x).y(instance.y)
              .on('zoom', function() {
                instance.layers.forEach(function(layer) { layer.update(); });
                gl.drawAxis(graph);
              }));
  }
};

gl.processRenderQueue = function(graph) {
  var i = 0, comp, instance = graph.instance;
  instance.components = [];
  var queueLength = graph.renderQueue.length;
  while (i < queueLength) {
    comp = graph.renderQueue.shift();
    instance.components.push(component[comp.type](graph, comp));
    i++;
  }
};

gl.drawAxis = function(graph) {
  var instance = graph.instance,
      x = instance.x,
      y = instance.y,
      w = instance.width,
      h = instance.height,
      xAxis = d3.svg.axis().scale(x).ticks(5).tickSize(-h).tickSubdivide(true),
      yAxis = d3.svg.axis().scale(y).orient('left').ticks(4).tickSize(-w).tickSubdivide(true);
  instance.axisPlane.select('.x.axis').remove();
  instance.axisPlane.select('.y.axis').remove();
  instance.axisPlane.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")")
      .call(xAxis);
  instance.axisPlane.append("svg:g")
      .attr("class", "y axis")
      .call(yAxis);
};

gl.redraw = function(graph) {
  var config = graph.config,
      instance = graph.instance;
  //If interactive
  gl.drawAxis(graph);
  instance.layers = [];
  var i, layerSettings;
  for (i = 0; i < config.components.length; i++) {
    layerSettings = config.components[i];
    instance.layers.push(component[layerSettings.renderer](graph, layerSettings));
  }
};

/**
 * This is the base class for runtime dialog objects. An instance of this
 * class represents a single named dialog for a single editor instance.
 *
 *    var graph = gl.graph()
 *
 * @class
 * @constructor Creates a new graph instance.
 * @param {Object} config Optional config.
 */
gl.graph = function(config) {
  function graph(selector) {
    var ele = d3.select(selector).node(), data, extent;
    instance.ele = ele;
    // have datasources return default data set
    data = dataSources[0].data;
    // x-scale
    extent = d3.extent(data, config.xAccessor);
    instance.x = config.scales.x()
        .domain([extent[0], extent[1]]) //this.options.xmin, this.options.xmax
        .range([0, instance.width]);

    // y-scale (inverted domain)
    extent = d3.extent(data, config.yAccessor);
    instance.y = config.scales.y()
        .domain([extent[1], 0]) //this.options.ymax, this.options.ymin
        .nice()
        .range([0, instance.height])
        .nice();
    graph.config = config;
    graph.instance = instance;
    graph.renderQueue = [];
    graph.dataSources = dataSources;
    if (config.legend) {
      graph.renderQueue.push({type: 'legend'});
    }
    if (config.loading) {
      graph.renderQueue.push({type: 'loader', id: 'loader'});
    }
    gl.render(graph);
    instance.isRendered = true;
    return graph;
  };
  graph.type = 'graph';
  gl_applyDefaults(graph, config);

  var dataSources = [];
  // instance properties are instance specific and values that are calculated. They don't get cloned.
  var instance = {
    'width': config.width - config.padding.left - config.padding.right,
    'height': config.height - config.padding.top  - config.padding.bottom,
    isRendered: false
  };
  instance.colorScale = config.colorScale();
  graph.type = 'graph';
  graph.render = graph; //alias

  graph.layer = function(layer) {
    config.components.push(layer);
    return graph;
  };

  graph.data = function(data) {
    // Should be find and update
    if (data) dataSources.push(data);
    return graph;
  };

  graph.style = function(css) {
    config.style += '\n' + css;
    return graph;
  };

  graph.clone = function() {
    return gl.graph(gl_objClone(config));
  };

  graph.getColor = function() {
    return instance.colorScale(gl_randomString());
  };

  graph.remove = function(id) {
    var i = gl_arrGetById(instance.components, id, true);
    if (i) {
      instance.components[i].remove();
      gl_arrRemoveAt(instance.components, i);
    }
  };

  graph.loading = function(value) {
    if (!arguments.length) return config.loading;
    if (instance.isRendered) {
      if (value) {
        graph.renderQueue.push({type: 'loader', id: 'loader'})
        gl.processRenderQueue(graph);
      } else {
        graph.remove('loader');
      }
    } else {
      config.loading = value; //apply overexisting value or object
    }
    return graph;
  }

  return graph;
};
