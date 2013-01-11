/**
 * @fileOverview
 *
 * An X or Y axis.
 */

define([
  'd3',
  'util/obj',
  'mixins/configurable'
],
function (d3, obj, configurable) {
  'use strict';

  return function (defaults) {

    var config_ = obj.empty(),
      selection_,
      d3axis_,
      defaults_ = {
        'color': '#666',
        'selection': null,
        'isFramed': true,
        'xScale': null,
        'yScale': null,
        'type': null,
        'opacity': 1
      };

    function axis(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      d3axis_ = d3.svg.axis();
      return axis;
    }

    axis.update = function () {
      d3axis_.scale(config_.xScale);

      selection_
        .attr({
          'class': 'axis ' + config_.type + '-axis ' + config_.id,
          'stroke': config_.color,
          'stroke-width': 1,
          'opacity': config_.opacity
        });
      selection_.selectAll('text')
        .attr({
          'fill': config_.color
        });

      if (config_.type === 'x') {
        selection_.attr('transform', 'translate(0,' + (config_.height) + ')');
      }

      return axis;
    };

    axis.render = function (selection) {

      selection_ = selection.append('g')
        .attr({
          'fill': 'none',
          'shape-rendering': 'crispEdges',
          'font-family': 'sans-serif',
          'font-size': '11'
        });

      d3axis_
        .orient(config_.orient)
        .tickSize(0);

      if (config_.type === 'x') {
        d3axis_
          .scale(config_.xScale)
          .ticks(d3.time.minutes, 15);
        selection_.attr('transform', 'translate(0,' + (config_.height) + ')');
      } else if (config_.type === 'y') {
        d3axis_.scale(config_.yScale);
      }

      // render the axis
      selection_.call(d3axis_);

      // remove boldness from default axis path
      selection_.selectAll('path')
        .attr({
          'fill': 'none'
        });
      // update fonts
      selection_.selectAll('text')
        .attr({
          'stroke': 'none'
        });

      // remove axis line
      selection_.selectAll('.domain')
        .attr({
          'stroke': 'none'
        });

      axis.update();

      return axis;
    };

    obj.extend(axis,
      configurable(axis, config_, []));

    return axis(defaults);
  };

});
