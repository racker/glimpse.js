var glimpse = {};
glimpse.utils = {};
glimpse.defaults = {};
glimpse.defaults.config = {};
glimpse.defaults.config.component = {};

/*********** Defaults ***********/
glimpse.defaults.config.graph = {
  'renderer': 'svg',
  'height': 500,
  'width': 500,
  'marginTop': 40,
  'marginRight': 40,
  'marginBottom': 40,
  'marginLeft': 40,
  'showAxis': true,
  'showAuxYAxis': false,
  'title': 'graph'
};

glimpse.defaults.config.component.line = {
  'cssClass': 'line'
};

glimpse.defaults.config.component.axis = {
  'color': 'black',
  'tickPadding': 10,
  'ticks': 7
};

/*********** Defaults ***********/

/*********** Graph ***********/
glimpse.graph = function (args) {
  var config_ = glimpse.defaults.config.graph,
  	components_ = [],
    panel_ = null,
    xScale_ = undefined,
    yScale_ = undefined,
    xAxis_ = undefined,
    yAxis_ = undefined,
    cssClass_ = 'graph',
  	data_ = [];

  function graph () {

  }

  graph.config = function (setting) {
  	if (!arguments.length) {
  		return config_;
  	}
  	if (glimpse.utils.isString(setting)) {
  		return config_[setting];
  	}
  	if (glimpse.utils.isObject(setting)) {
      for (var property in setting) {
        config_[property] = setting[property];
      }
    }
  	return graph;
  };

  //scales
  graph.xScale = function (scale) {
    if (!arguments.length) {
      return xScale_;
    }
    xScale_ = scale;
    return line;
  };

  graph.yScale = function (scale) {
    if (!arguments.length) {
      return yScale_;
    }
    yScale_ = scale;

    return line;
  };

  //axes
  graph.xAxis = function (axis) {
    if (!arguments.length) {
      return xAxis_;
    }
    xAxis_ = axis;
  	return graph;
  };

  graph.yAxis = function (axis) {
    if (!arguments.length) {
      return yAxis_;
    }
    yAxis_ = axis
  	return graph;
  };

  graph.yAuxAxis = function (axis) {
    if (!arguments.length) {
      return yAuxAxis_;
    }
  	yAuxAxis_ = axis
    return graph;
  };

  graph.data = function (_) {
  	if (!arguments.length) {
  		return data_;
  	}
  	data_ = _;
  	return graph;
  };

  graph.component = function (component) {
  	components_.push(component);
  	return graph;
  }

  graph.render = function (selection) {
    panel_ = d3.select(selection).append("svg:svg")
                .attr("width", config_.width + config_.marginLeft + config_.marginRight)
                .attr("height", config_.height + config_.marginTop + config_.marginBottom)
                .append("g")
                .attr("transform", "translate(" + 100 + "," + config_.marginTop + ")");;

    if (!xScale_) {
      xScale_ = d3.time.scale()
                      .range([0, config_.width]);
    }

    if (!yScale_) {
      yScale_ = d3.scale.linear()
        .range([config_.height, 0]);
    }

    if (data_) {
      setDomain();
    }

    if (!xAxis_) {
      xAxis_ = glimpse.component.axis()
        .scale(xScale_)
        .config({'orient': 'bottom', 'class': 'x-axis', 'ticks': 7});
    }

    if (!yAxis_) {
      yAxis_ = glimpse.component.axis()
          .scale(yScale_)
          .config({'orient': 'left', 'class': 'y-axis', 'ticks': 7});
    }

  	if (config_['showAxis']) {

      xAxis = d3.svg.axis().scale(xScale_).orient('bottom').tickPadding(10).ticks(7);
      yAxis = d3.svg.axis().scale(yScale_).orient('left').tickPadding(10);
      panel_.append('svg:g')
        .attr('class', 'y-axis')
        .call(yAxis);
      panel_.append('svg:g')
        .attr('class', 'x-axis')
        .attr("transform", "translate(0," + config_.height + ")")
        .call(xAxis);
      /*
      xAxis_.render(this, panel_);
      yAxis_.render(this, panel_);
      */
  	}

  	//iterate through each component and render the component
  	for (var i in components_) {
  		var component = components_[i];
  		component.render(this, panel_);
  	}

    var dataset = getDataSet();

    //legend
/*
    var legend = panel_.append("g")
      .attr("class", "legend")
      .attr("x", config_.width - 65)
      .attr("y", 25)
      .attr("height", 100)
      .attr("width", 100);

      legend.selectAll('g').data(dataset)
      .enter()
      .append('g')
      .each(function(d, i) {
        var g = d3.select(this);
        g.append("rect")
          .attr("x", config_.width - 165)
          .attr("y", i*25)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", 'steel-blue');

        g.append("text")
          .attr("x", config_.width - 150)
          .attr("y", i * 25 + 8)
          .attr("height",30)
          .attr("width",100)
          .style("fill", 'steel-blue')
          .text('sometext');
   });
*/
    //legend

  };

  //todo: apply multiple data series to the scales
  function setDomain () {
    //todo: calculate min and max of all the series
    //and set the domain
    var data = data_['series1'];
    xScale_.domain([data[0].x, data[data.length - 1].x]);
    yScale_.domain([0, d3.max(data, function(d) { return d.y })]);
  }

  function getDataSet () {
    var dataset = [];
    for(var prop in data_) {
      dataset.push(data_.prop);
    }
    return dataset;
  }

  return graph;
};
/*********** Graph ***********/


/*********** Component ***********/
glimpse.component = function () {

  function component() {

  }

  return component;
};

/*********** Line ***********/
glimpse.component.line = function () {

  var lineGenerator_ = null;
      config_ = glimpse.defaults.config.component.line,
      dataId_ = null,
      components_ = [];

  var line = {};

  line.config = function (setting) {
    //todo: move this logic to a common function
    if (!arguments.length) {
      return config_;
    }

  	if (glimpse.utils.isString(setting)) {
  		return config_[setting];
  	}

  	if (glimpse.utils.isObject(setting)) {
  		for (var property in setting) {
				config_[property] = setting[property];
			}
  	}

  	return line;
	};

  //data
  line.dataId = function (dataSourceId) {
  	if (!arguments.length) {
  		return dataId_;
  	}
  	dataId_ = dataSourceId;
  	return line;
  };

  line.component = function (comp) {
    components_.push(comp);
    return line;
  }

  line.render = function (graph, selection) {

  	var graphConfig = graph.config(),
        data = graph.data(),
        xScale = graph.xScale();
        yScale = graph.yScale();

    if(!lineGenerator_) {
      lineGenerator_= d3.svg.line()
          .x(function(d,i) {
            return xScale(d.x);
          })
          .y(function(d) {
            return yScale(d.y);
          })
          .interpolate("linear");
    }

    selection.append("svg:g").append("svg:path")
      .datum(data[dataId_])
      .attr("class", config_.cssClass)
      .attr("d", lineGenerator_);

    for (var i = 0; i < components_.length; i++) {
      components_[i].render();
    }
  }

	return line;
};
/*********** Line ***********/


/*********** Axes ***********/
glimpse.component.axis = function () {
  var config_ = glimpse.defaults.config.component.axis;
      axis_ = d3.svg.axis();

  function axis () {

  }

  axis.scale = function (s) {
    if (!arguments.length) {
      return axis_.scale;
    }
    axis_.scale = s;

    return axis;
  }

  axis.config = function (setting) {
    //todo: move this logic to a common function
    if (!arguments.length) {
      return config_;
    }
    if (glimpse.utils.isString(setting)) {
      return config_[setting];
    }
    if (glimpse.utils.isObject(setting)) {
      for (var property in setting) {
        for (var prop in config_) {
          config_[property] = setting[property];
        }
      }
    }
    return axis;
  };

  axis.render = function (graph, selection) {
    /*
    panel_.append('svg:g')
        .attr('class', 'y-axis')
        .call(yAxis);
    panel_.append('svg:g')
        .attr('class', 'x-axis')
        .attr("transform", "translate(0," + config_.height + ")")
        .call(xAxis);
        */
    selection.append("svg:g").call(axis_);
  }

	return axis;
};
/*********** Axes ***********/

/*********** Legend ***********/
glimpse.component.legend = function () {
  var text_ = null;

  function legend () {

  }

  legend.text = function (_) {
    if (!arguments.length) {
      return text_;
    }
    text_ = _;
    return legend;
  }

  legend.render = function () {

    //legend
/*
    var legend = panel_.append("g")
      .attr("class", "legend")
      .attr("x", config_.width - 65)
      .attr("y", 25)
      .attr("height", 100)
      .attr("width", 100);

      legend.selectAll('g').data(dataset)
      .enter()
      .append('g')
      .each(function(d, i) {
        var g = d3.select(this);
        g.append("rect")
          .attr("x", config_.width - 165)
          .attr("y", i*25)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", 'steel-blue');

        g.append("text")
          .attr("x", config_.width - 150)
          .attr("y", i * 25 + 8)
          .attr("height",30)
          .attr("width",100)
          .style("fill", 'steel-blue')
          .text('sometext');
   });
*/
    //legend
  }

  return legend;
}
/*********** Legend ***********/


/*********** Utils ***********/
glimpse.utils.isString = function (s) {
	return typeof s === 'string' || s instanceof String;
};

glimpse.utils.isObject = function (o) {
	return typeof o === 'object';
};
/*********** Utils ***********/
