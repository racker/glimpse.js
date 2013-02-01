/**
 * @fileOverview
 * Axis component.
 */
define([
  'core/object',
  'core/config',
  'core/string'
],
function (obj, config, string) {
  'use strict';

  return function () {

    var config_,
      defaults_,
      root_,
      d3axis_;

    config_ = {};

    defaults_ = {
        type: 'x',
        id: string.random(),
        isFramed: true,
        color: '#333',
        opacity: 0.8,
        fontFamily: 'arial',
        fontSize: 10,
        textBgColor: '#fff',
        textBgSize: 3,
        tickSize: 0
    };

    /**
     * Main function for Axis component.
     */
    function axis() {
      obj.extend(config_, defaults_);
      d3axis_ = d3.svg.axis();
      return axis;
    }

    /**
     * Apply updates to the axis.
     */
    axis.update = function () {
      if (config_.type === 'x') {
        root_.attr('transform', 'translate(0,' + (config_.height) + ')');
      }

      root_.selectAll('g').remove();
      d3axis_.scale(config_.scale)
        .orient(config_.orient)
        .tickSize(config_.tickSize);

      root_.call(d3axis_);

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

      // apply text background for greater readability.
      root_.selectAll('.gl-axis text').each(function () {
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
     * Render the axis to the selection
     * @param {d3.selection|String} selection A d3 selection
     * @return {component.axis}
     */
    axis.render = function (selection) {

      root_ = selection.append('g')
        .attr({
          'id': config_.id,
          'fill': 'none',
          'shape-rendering': 'crispEdges',
          'font-family': config_.fontFamily,
          'font-size': config_.fontSize,
          'class': string.classes('axis', config_.type + '-axis '),
          'stroke': config_.color,
          'stroke-width': 1,
          'opacity': config_.opacity
        });

      axis.update();

      return axis;
    };

    obj.extend(axis, config(axis, config_, []));
    return axis();
  };

});
