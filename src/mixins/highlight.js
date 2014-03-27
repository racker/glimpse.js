define(['data/functions'], function (dataFns) {
  'use strict';

  /**
   * Calculates the nearest data point based on the x co-ordinate
   * of current event.
   * Calculates the x dimension equivalent by inverting the scale and
   * uses https://github.com/mbostock/d3/wiki/Arrays#wiki-d3_bisector
   * to determine the approximate index of the closest point.
   * @param  {Object} config
   * @param  {Object} dataSource
   * @param  {Number} xPos
   * @return {Object} datapoint closest to the x co-ordinate
   */
  function calculateNearestDataPoint(config, dataSource, xPos) {
    var data, startX, xDim, bisectData,
      d0, d1, clampedDataIndex, clampedData;

    xDim = dataFns.dimension(dataSource, 'x');
    data = dataSource.data;

    startX = config.xScale.invert(xPos);
    bisectData = d3.bisector(function(d) { return xDim(d); }).left;
    clampedDataIndex = bisectData(data, startX, 1);

    d0 = data[clampedDataIndex - 1];
    d1 = data[clampedDataIndex];
    if (d1) {
      clampedData = startX -  xDim(d0) >  xDim(d1) - startX ? d1 : d0;
    } else {
      clampedData = d0;
    }

    return clampedData;
  }

  /**
   * Calculates the closest data-point component's data
   * and highlights it.
   * @param  {components.component} component
   * @param  {data.collection} dataCollection
   * @param  {Number} xPos
   * @param {Object} datapoint closest to the x co-ordinate
   */
  function highlightNearestPoint(component, dataCollection, xPos,
    dataPoint) {
    var config, selection, root, radius, xDim, yDim, dataSource;

    config = component.config();
    root = component.root();
    dataSource = component.data();
    xDim = dataFns.dimension(dataSource, 'x');
    yDim = dataFns.dimension(dataSource, 'y');
    selection = root.select('.' + getClassName(config));
    selection.attr({
      'r': config.highlightRadius,
      'visibility': getVisibility(component, dataCollection),
      'transform': 'translate(' + config.xScale(xDim(dataPoint)) +
        ',' + config.yScale(yDim(dataPoint)) + ')'
    });

    if (config.type === 'scatter') {
      radius = dataFns.dimension(dataSource, 'r')(dataPoint);
      selection.attr('r', radius ? radius : config.radius);
    }
  }

  function showHighlightTransition(selection, config) {
    selection.transition()
      .duration(config.highlightTransDuration)
      .delay(config.highlightTransDelay)
      .attr('r', 0);
  }

  function getVisibility(component, dataCollection) {
    if (dataCollection.hasTags(component.config().dataId, 'inactive')) {
      return 'hidden';
    }
    return 'visible';
  }

  function getClassName(config) {
    return 'gl-highlight-' + config.cid;
  }

  function processComponentMousemove(target, component, dataCollection) {
    var xPos, dataPoint, config, dataSource;
      config = component.config();
      dataSource = component.data();
      xPos = d3.mouse(target)[0];
      dataPoint = calculateNearestDataPoint(
        config,
        dataSource,
        xPos
      );

      if (xPos > 0) {
        highlightNearestPoint(
          component,
          dataCollection,
          xPos,
          dataPoint
        );
      }

      return {
        data: {
          'x': config.xScale(dataFns.dimension(dataSource, 'x')(dataPoint)),
          'y': config.yScale(dataFns.dimension(dataSource, 'y')(dataPoint))
         },
        message: {
          text: dataFns.dimension(component.data(), 'tooltip')(dataPoint),
          color: config.color
        }
      };
  }

  function processComponentMouseOut(component) {
    var selection, config;

    config = component.config();
    selection = component.root()
      .select('.' + getClassName(config));

    if (config.showHighlightTransition) {
      showHighlightTransition(selection, config);
    } else{
      selection.attr('visibility', 'hidden');
    }
  }

  return {
    /**
    * Sets the highlight and pub/sub events
    */
    initHighlight: function() {
      var _ = this._;
      if (_.config.showHighlight && !_.isHighlighted) {
        this.highlight();
        this.pubsubHighlightEvents(_.globalPubsub, _.dataCollection);
        _.isHighlighted = true;
      }
      return this;
    },

    /**
     * Adds a circle for the component
     * which will be highlighted on hover.
     * @return {components.component}
     */
    highlight: function() {
      var root, config;
      root = this.root();
      config = this.config();

      if (root) {
        //Ensures that highlight is added only once
        if (!root.select('.' + getClassName(config)).node()) {
          root.append('circle')
          .attr({
            'fill': config.highlightFill,
            'stroke': config.color,
            'stroke-width': config.highlightStrokeWidth,
            'r': config.highlightRadius,
            'class': getClassName(config),
            'visibility': 'hidden',
            'pointer-events': 'none'
          });
        }
      }
      return this;
    },

    /**
     * Pub/Sub highlight events
     * @param  {events.pubsub} pubSub
     * @param  {data.collection} dataCollection
     * @return {components.component}
     */
    pubsubHighlightEvents: function(pubSub, dataCollection) {
      var root, mouseout, mousemove, component, config;

      config = this.config();

      if (config.showTooltip) {
        root = this.root();
        mousemove = this.scope('mousemove');
        mouseout = this.scope('mouseout');
        component = this;
        if (root) {
          root.on('mousemove', function() {
            pubSub.pub(
              mousemove,
              d3.event.target,
              component,
              dataCollection,
              pubSub
            );
            }, true);
          root.on('mouseout', function() {
              pubSub.pub(mouseout, component, pubSub);
            }, true);
          pubSub.sub(mouseout, component.handleMouseOut);
          pubSub.sub(mousemove, component.handleMouseMove);
        }
      }

      return this;
    },

    /**
     * Handler for mousemove event on the root of the
     * component
     * @param  {Element} target
     * @param  {components.component} component
     * @param  {data.collection} dataCollection
     * @param  {events.pubsub} pubSub
     * @return {components.component}
     */
    handleMouseMove: function(target, component, dataCollection, pubSub) {
      var highlight;

      highlight = processComponentMousemove(target, component, dataCollection);

      //Event to show the tooltip
      pubSub.pub(
        component.globalScope('tooltip-show'),
        highlight.data,
        target,
        [highlight.message]
      );
      return this;
    },

    /**
     * Handler for mousemove event on graph
     * @param  {Element} target
     * @param  {componentManager} componentManager
     * @param  {data.collection} dataCollection
     * @param  {events.pubsub} pubSub
     * @return {graphs.graph}
     */
    handleGraphMouseMove: function(target, componentManager,
      dataCollection, pubSub) {
      var components, highlight,
        dataPoints = [],
        messages = [],
        closestComponents = [];

      components = componentManager.get(componentManager.cids());

      components.forEach(function(component) {
        if (component.config().hasOwnProperty('showTooltip') &&
          getVisibility(component, dataCollection) === 'visible') {
          highlight = processComponentMousemove(
            target,
            component,
            dataCollection
          );
          dataPoints.push(highlight.data);
          messages.push(highlight.message);
          closestComponents.push(component);
        }
      });

      //Construct messages
      //Event to show the tooltip
      pubSub.pub(
        closestComponents[0].globalScope('tooltip-show'),
        dataPoints[0],
        target,
        messages);

      return this;
    },

    /**
     * Handler for mouseout event on graph
     * @param  {graphs.graph} graph
     * @param  {events.pubsub} pubSub
     * @return {graphs.graph}
     */
    handleGraphMouseOut: function(graph, pubSub) {
      var components, componentManager;
      componentManager = graph.component();
      components = componentManager.get(componentManager.cids());

      components.forEach(function(component) {
        processComponentMouseOut(component);
      });
      pubSub.pub(graph.globalScope('tooltip-hide'));
      return this;
    },

    /**
     * Handler for mouseout event on root of
     * the component
     * @param  {components.component} component
     * @param  {events.pubsub} pubSub
     * @return {components.component}
     */
    handleMouseOut: function(component, pubSub) {
      processComponentMouseOut(component);
      pubSub.pub(component.globalScope('tooltip-hide'));
      return this;
    },

    /**
     * Highlights the closest data point on hover.
     * @param  {components.component} component
     * @param  {Object} dataCollection
     * @param  {Number} xPos
     */
    highlightOnHover: function(component, dataCollection, xPos) {
      var dataPoint;

      dataPoint = calculateNearestDataPoint(
        component.config(),
        component.data(),
        xPos
      );
      highlightNearestPoint(component, dataCollection, xPos, dataPoint);
      return this;
    }
  };

});
