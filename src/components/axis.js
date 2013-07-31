/**
 * @fileOverview
 * Axis component.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, mixins, d3util) {
  'use strict';

  return function() {

    var _ = {
        config: {}
      };

    _.defaults = {
      type: 'axis',
      axisType: 'x',
      gap: 0,
      target: null,
      color: '#333',
      opacity: 0.8,
      fontFamily: 'arial',
      fontSize: 10,
      textBgColor: '#fff',
      textBgSize: 3,
      tickSize: 0,
      ticks: 3,
      hiddenStates: null,
      rootId: null,
      zIndex: 10
    };

    /**
     * Translates the zero tick on the Y-axis by 10
     * @private
     */
    function setZeroTickTranslate(selection) {
      var transform;
      transform = d3.transform(selection.attr('transform'));
      transform.translate[1] -= 10;
      selection.attr('transform', transform.toString());
    }

    /**
     * Changes the default formatting of the d3 axis.
     * @private
     */
    function formatAxis() {
      var zeroTick, zeroTickLabel;
      // remove boldness from default axis path
      _.root.selectAll('path')
        .attr({
          'fill': 'none'
        });

      // update fonts
      _.root.selectAll('text')
        .attr({
          'stroke': 'none',
          'fill': _.config.color
        });

      //Apply padding to the first tick on Y axis
      if (_.config.axisType === 'y') {
        zeroTick = _.root.select('g');

        if (zeroTick.node()) {
          zeroTickLabel = zeroTick.text() +
            (_.config.unit ? ' ' + _.config.unit : '');
          zeroTick.select('text').text(zeroTickLabel);
          setZeroTickTranslate(zeroTick);
        }
      }

      // apply text background for greater readability.
      _.root.selectAll('.gl-axis text').each(function() {

        var textBg = this.cloneNode(true);
        d3.select(textBg).attr({
          stroke: _.config.textBgColor,
          'stroke-width': _.config.textBgSize
        });
        this.parentNode.insertBefore(textBg, this);
      });

      // remove axis line
      _.root.selectAll('.domain')
        .attr({
          'stroke': 'none'
        });
    }

    /**
     * Main function for Axis component.
     */
    function axis() {
      obj.extend(_.config, _.defaults);
      _.d3axis = d3.svg.axis();
      axis.rebind(
        _.d3axis,
        'scale',
        'orient',
        'ticks',
        'tickValues',
        'tickSubdivide',
        'tickSize',
        'tickPadding',
        'tickFormat');
      return axis;
    }
    axis._ = _;

    // Apply mixins.
    obj.extend(
      axis,
      mixins.component);

    axis.init();

    /**
     * Apply updates to the axis.
     */
    axis.update = function() {
      if (!_.root) {
        return axis;
      }
      _.root.selectAll('g').remove();
      axis.reapply();
      _.root.call(_.d3axis);
      _.root.attr({
        'font-family': _.config.fontFamily,
        'font-size': _.config.fontSize,
        'class': string.classes('component',
            'axis', _.config.axisType + '-axis '),
        'stroke': _.config.color,
        'opacity': _.config.opacity
      });
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }

      formatAxis();
      axis.applyZIndex();
      axis.dispatch.update.call(this);
      return axis;
    };

    /**
     * Render the axis to the selection
     * @param {d3.selection|String} selection A d3 selection
     * @return {component.axis}
     */
    axis.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(axis, selection, function(target) {
          return target.append('g')
            .attr({
              'fill': 'none',
              'shape-rendering': 'crispEdges',
              'stroke-width': 1
            });
        });
      }
      axis.update();
      axis.dispatch.render.call(this);
      return axis;
    };

    /**
     * Gets or sets the d3axis function
     * @param  {d3.svg.axis} d3Axis
     * @return {component.axis}
     */
    axis.d3axis = function(d3Axis) {
      if (d3Axis) {
        _.d3axis = d3Axis;
        return axis;
      }
      return _.d3axis;
    };

    return axis();
  };

});
