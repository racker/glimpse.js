define(['data/functions'], function (dataFns) {
  'use strict';


  function calculateNearestDataPoint(config, dataSource, xPos) {
    var data, startX, stepX, clampedXPos, xDim;

    xDim = dataFns.dimension(dataSource, 'x');

    data = dataSource.data;
    startX = xDim(data[0]);

    //Assume data set is periodic
    stepX = xDim(data[1]) - xDim(data[0]);
    clampedXPos = Math.round((config.xScale.invert(xPos) - startX) / stepX);

    return data[clampedXPos];
  }

  /**
   * Calculates the closest data-point component's data
   * and highlights it.
   * @param  {Object} dataSource
   * @param  {Number} xPos
   */
  function highlightNearestPoint(component, dataCollection, xPos) {
    var config, dataPoint, selection, root, radius, xDim, yDim, dataSource;

    config = component.config();
    root = component.root();
    dataSource = component.data();
    xDim = dataFns.dimension(dataSource, 'x');
    yDim = dataFns.dimension(dataSource, 'y');
    dataPoint = calculateNearestDataPoint(config, dataSource, xPos);
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
    if (dataCollection.hasTags(component.config().id, 'inactive')) {
      return 'hidden';
    }
    return 'visible';
  }

  function getClassName(config) {
    return 'gl-highlight-' + config.cid;
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
      var root, mouseout, mousemove, component;

      root = this.root();
      mousemove = this.scope('mousemove');
      mouseout = this.scope('mouseout');
      component = this;
      if (root) {
        root.on('mousemove', function() {
          pubSub.pub(
            mousemove,
            event.target,
            component,
            dataCollection
          );
          }, true);
        root.on('mouseout', function() {
            pubSub.pub(mouseout, component);
          }, true);
        pubSub.sub(mouseout, component.handleMouseOut);
        pubSub.sub(mousemove, component.handleMouseMove);
      }
      return this;
    },

    /**
     * Handler for mousemove event on the root of the
     * component
     * @param  {Element} target
     * @param  {components.component} component
     * @param  {data.collection} dataCollection
     * @return {components.component}
     */
    handleMouseMove: function(target, component, dataCollection) {
      var xPos;
      xPos = d3.mouse(target)[0];
      if (xPos > 0) {
        highlightNearestPoint(component, dataCollection, d3.mouse(target)[0]);
      }
      return this;
    },

    /**
     * Handler for mouseout event on root of
     * the component
     * @param  {components.component} component
     * @return {components.component}
     */
    handleMouseOut: function(component) {
      var selection, config;

      config = component.config();
      selection = component.root()
        .select('.' + getClassName(config));

      if (config.showHighlightTransition) {
        showHighlightTransition(selection, config);
      } else{
        selection.attr('visibility', 'hidden');
      }
      return this;
    },

    /**
     * Highlights the closest data point on hover.
     * @param  {components.component} component
     * @param  {Object} dataCollection
     * @param  {Number} xPos
     */
    highlightOnHover: function(component, dataCollection, xPos) {
      highlightNearestPoint(component, dataCollection, xPos);
      return this;
    }
  };

});
