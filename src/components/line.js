/**
 * @fileOverview
 * Reusuable line component.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/function',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions'
],
function(array, config, obj, fn, string, d3util, mixins, dataFns) {
  'use strict';


  return function() {

    //Private variables
    var _ = {
      config: {},
      isHighlighted: false
    };

    _.defaults = {
      type: 'line',
      target: null,
      cid: null,
      color: null,
      dashed: false,
      strokeDashArray: '5, 5',
      strokeWidth: 1.5,
      inLegend: true,
      lineGenerator: d3.svg.line(),
      interpolate: 'linear',
      xScale: null,
      yScale: null,
      opacity: 1,
      hiddenStates: null,
      rootId: null,
      zIndex: 5,
      showHighlightTransition: false,
      highlightRadius: 4,
      highlightFill: '#fff',
      highlightStrokeWidth: 2,
      highlightTransDuration: 500,
      highlightTransDelay: 1000,
      showTooltip: false,
      showHighlight: true
    };

    /**
     * Updates the line component
     * @param  {d3.selection} selection
     */
    function update(selection) {
      selection
        .datum(line.data().data)
        .attr({
          'stroke-width': _.config.strokeWidth,
          'stroke-dasharray': _.config.dashed ? _.config.strokeDashArray : null,
          'stroke': _.config.color,
          'opacity': _.config.opacity,
          'd': _.config.lineGenerator
      });
    }

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
     * Gets value of X for a data object
     * Converts into UTC data for time series.
     * @param  {Object} data
     * @param  {number} index
     * @return {string|number}
     */
    function getX(data, index) {
      var x, dataConfig;
      dataConfig = line.data();
      x = dataFns.dimension(
        dataConfig,
        'x'
      )(data, index);
      return x;
    }

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the line component
     * @param  {string} dataId
     */
     function handleDataToggle(args) {
      var id = _.config.dataId;
      if (args === id) {
        if (_.dataCollection.hasTags(id, 'inactive')) {
          line.hide();
        } else {
          line.show();
        }
      }
    }

    /**
     * Main function for line component
     * @return {components.line}
     */
    function line() {
      obj.extend(_.config, _.defaults);
      return line;
    }
    line._ = _;

    obj.extend(
      line,
      config.mixin(
        _.config,
        'xScale',
        'yScale',
        'lineGenerator',
        'color',
        'showTooltip',
        'showHighlight'
      ),
      mixins.component,
      mixins.highlight);

    line.init();

    /**
     * Updates the line component with new/updated data/config
     * @return {components.line}
     */
    line.update = function() {
      var dataConfig, selection;

      if (!_.root) {
        return line;
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      line.initHighlight();
      dataConfig = line.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return line;
      }
      // Configure the lineGenerator function
      _.config.lineGenerator
        .x(function(d, i) {
          return _.config.xScale(getX(d, i));
        })
        .y(function(d, i) {
          return _.config.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        })
        .defined(function(d, i) {
          var minX;
          minX = _.config.xScale.range()[0];
          return _.config.xScale(getX(d, i))  >= minX;
        })
        .interpolate(_.config.interpolate);
      selection = _.root.select('.gl-path')
        .data(dataConfig.data);
      update(selection);
      remove(selection);
      line.applyZIndex();
      line.emit('update');
      return line;
    };

    /**
     * Renders the line component
     * @param  {d3.selection|Node|string} selection
     * @return {components.line}
     */
    line.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(line, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'line')
            });
          root.append('path')
            .attr({
              'class': 'gl-path',
              'fill': 'none'
            });
          return root;
        });
      }
      _.globalPubsub.sub(line.globalScope('data-toggle'), handleDataToggle);
      line.update();
      line.emit('render');
      return line;
    };

    /**
     * Destroys the line and removes everything from the DOM.
     * @public
     */
    line.destroy = fn.compose.call(line, line.destroy, function() {
      _.globalPubsub.unsub(line.globalScope('data-toggle'), handleDataToggle);
      _.globalPubsub.unsub(line.scope('mouseout'), line.handleMouseOut);
      _.globalPubsub.unsub(line.scope('mousemove'), line.handleMouseMove);
    });

    return line();

  };
});
