/**
 * @fileOverview
 * Axis component.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'components/mixins',
  'd3-ext/util'
],
function(obj, config, string, mixins, d3util) {
  'use strict';

  return function() {

    var config_,
      defaults_,
      root_,
      d3axis_,
      formatAxis_;

    config_ = {};

    defaults_ = {
        type: 'x',
        id: string.random(),
        gap: 0,
        target: '.gl-framed',
        color: '#333',
        opacity: 0.8,
        fontFamily: 'arial',
        fontSize: 10,
        textBgColor: '#fff',
        textBgSize: 3,
        tickSize: 0,
        ticks: 3
    };

    /**
     * @private
     * Changes the default formatting of the d3 axis.
     */
    formatAxis_ = function() {
      // remove boldness from default axis path
      root_.selectAll('path')
        .attr({
          'fill': 'none'
        });

      // update fonts
      root_.selectAll('text')
        .attr({
          'stroke': 'none',
          'fill': config_.color
        });

      //Apply padding to the first tick on Y axis
      if (config_.type === 'y') {
        var zeroTick, transform;

        zeroTick = root_.select('g');
        if (zeroTick.node()) {
          transform = d3.transform(zeroTick.attr('transform'));
          transform.translate[1] -= 10;
          zeroTick.attr('transform', transform.toString());
        }
      }

      // apply text background for greater readability.
      root_.selectAll('.gl-axis text').each(function() {

        var textBg = this.cloneNode(true);
        d3.select(textBg).attr({
          stroke: config_.textBgColor,
          'stroke-width': config_.textBgSize
        });
        this.parentNode.insertBefore(textBg, this);
      });

      // remove axis line
      root_.selectAll('.domain')
        .attr({
          'stroke': 'none'
        });
    };

    /**
     * Main function for Axis component.
     */
    function axis() {
      obj.extend(config_, defaults_);
      d3axis_ = d3.svg.axis();
      axis.rebind(
        d3axis_,
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

    /**
     * Apply updates to the axis.
     */
    axis.update = function() {
      root_.selectAll('g').remove();
      axis.reapply();
      root_.call(d3axis_);
      root_.attr({
        'font-family': config_.fontFamily,
        'font-size': config_.fontSize,
        'class': string.classes('axis', config_.type + '-axis '),
        'stroke': config_.color,
        'opacity': config_.opacity
      });
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      formatAxis_();
      return axis;
    };

    /**
     * Render the axis to the selection
     * @param {d3.selection|String} selection A d3 selection
     * @return {component.axis}
     */
    axis.render = function(selection) {
      root_ = d3util.select(selection).append('g')
        .attr({
          'fill': 'none',
          'shape-rendering': 'crispEdges',
          'stroke-width': 1
        });
      axis.update();
      return axis;
    };

    /**
     * Gets or sets the d3axis function
     * @param  {d3.svg.axis} d3Axis
     * @return {component.axis}
     */
    axis.d3axis = function(d3Axis) {
      if (d3Axis) {
        d3axis_ = d3Axis;
        return axis;
      }
      return d3axis_;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    axis.root = function() {
      return root_;
    };

    obj.extend(axis, config.mixin(config_, 'cid'), mixins.toggle);
    return axis();
  };

});
