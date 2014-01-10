/**
 * @fileOverview
 * Reusuable scatter-plot component.
 */
define([
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'events/pubsub',
  'core/function'
],
function(configMixin, obj, string, d3util, mixins, dataFns, pubsub, fn) {
  'use strict';

  return function() {

    //Private variables
    var _ = {
      config: {},
      isHighlighted: false
    };

    _.defaults = {
      type: 'scatter',
      target: null,
      cid: null,
      color: '#333',
      strokeWidth: 1.5,
      radius: 6,
      inLegend: true,
      xScale: null,
      yScale: null,
      opacity: 0.4,
      hiddenStates: null,
      rootId: null,
      showTransition: false,
      preTransitionRadius: 5,
      preTransitionColor: '#333',
      delay: 100,
      duration: 1000,
      ease: 'linear',
      showHighlightTransition: false,
      highlightRadius: 4,
      highlightFill: '#fff',
      highlightStrokeWidth: 2,
      showTooltip: true,
      showHighlight: true
    };

    /**
     * Removes elements from the exit selection
     * @param  {d3.selection|Node|string} selection
     */
    function remove(selection) {
      if (selection && selection.exit) {
        selection.exit().remove();
      }
    }

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the scatter component
     * @param  {string} dataId
     */
     function handleDataToggle(args) {
      var id = _.config.dataId;
      if (args === id) {
        if (_.dataCollection.hasTags(id, 'inactive')) {
          scatter.hide();
        } else {
          scatter.show();
        }
      }
    }

    function getRadius(d, i) {
      var radiusDim;
      radiusDim = dataFns.dimension(scatter.data(), 'r')(d, i);
      if (radiusDim !== null) {
        return radiusDim;
      }
      return _.config.radius;
    }

    function getColor(d, i) {
      var colorDim;
      colorDim = dataFns.dimension(scatter.data(), 'color')(d, i);
      if (colorDim !== null) {
        return colorDim;
      }
      return _.config.color;
    }

    /**
     * Updates the scatter component
     * @param  {d3.selection} selection
     */
    function update(selection) {
      var dataConfig;
      dataConfig = scatter.data();
      selection
        .attr({
          cx: function(d, i) {
            return _.config.xScale(dataFns.dimension(dataConfig, 'x')(d, i));
          },
          cy: function(d, i) {
            return _.config.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
          },
          r: _.config.showTransition ? _.config.preTransitionRadius : getRadius,
          fill: _.config.showTransition ? _.config.preTransitionColor
            : getColor,
          opacity: _.config.opacity,
          'class': string.classes('scatter-point')
        });
      if (_.config.showTransition) {
        scatter.applyTransition(selection);
      }
    }

    /**
     * Main function for scatter component
     * @return {components.scatter}
     */
    function scatter() {
      obj.extend(_.config, _.defaults);
      return scatter;
    }

    scatter._ = _;

    obj.extend(
      scatter,
      configMixin.mixin(
        _.config,
        'xScale',
        'yScale',
        'color',
        'opacity',
        'radius',
        'showTooltip',
        'showHighlight'
      ),
      mixins.component,
      mixins.highlight);

    scatter.init();

    /**
     * Updates the scatter component with new/updated data/config
     * @return {components.scatter}
     */
    scatter.update = function() {
      var dataConfig, selection;

      if (!_.root) {
        return scatter;
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      dataConfig = scatter.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return scatter;
      }
      scatter.initHighlight();

      selection = _.root.selectAll('.gl-scatter-point')
        .data(dataConfig.data);

      selection
        .enter()
        .append('circle');

      update(selection);
      remove(selection);
      scatter.emit('update');
      return scatter;
    };

    /**
     * Renders the scatter component
     * @param  {d3.selection|Node|string} selection
     * @return {components.scatter}
     */
    scatter.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(scatter, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'scatter')
            });
          return root;
        });
      }
      _.globalPubsub.sub(scatter.globalScope('data-toggle'), handleDataToggle);
      scatter.update();
      scatter.emit('render');
      return scatter;
    };

    /**
     * Applies transitions to the scatter plot
     * @param {d3.selection|Node|string} selection
     */
    scatter.applyTransition = function(selection) {
      selection.transition()
        .delay(_.config.delay)
        .duration(_.config.duration)
        .ease(_.config.ease)
        .attr({
          r: getRadius,
          fill: getColor
        });
      return scatter;
    };

    /**
     * Destroys the scatter and removes everything from the DOM.
     * @public
     */
    scatter.destroy = fn.compose.call(scatter, scatter.destroy, function() {
      _.globalPubsub.unsub(
        scatter.globalScope('data-toggle'), handleDataToggle);
      _.globalPubsub.sub(scatter.scope('mouseout'), scatter.handleMouseOut);
      _.globalPubsub.sub(scatter.scope('mousemove'), scatter.handleMouseMove);
    });

    return scatter();

  };
});
