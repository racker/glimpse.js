define([
  'core/object',
  'core/config',
  'core/string'
],
function (obj, config, string) {
  'use strict';

  return function () {

    var config_ = {},
      defaults_ = {
        id: string.random(),
        isFramed: true,
        color: '#333',
        opacity: 0.8
      },
      root_,
      d3axis_;

    function axis() {
      obj.extend(config_, defaults_);
      d3axis_ = d3.svg.axis();
      return axis;
    }

    axis.update = function () {
      d3axis_.scale(config_.scale)
        .orient(config_.orient);
    };

    axis.render = function (selection) {
      // TODO: need to move some of this stuff to update()

      root_ = selection.append('g')
        .attr({
          'id': config_.id,
          'fill': 'none',
          'shape-rendering': 'crispEdges',
          'font-family': 'sans-serif',
          'font-size': '11',
          'class': 'axis ' + config_.type + '-axis ' + config_.id,
          'stroke': config_.color,
          'stroke-width': 1,
          'opacity': config_.opacity
        });

      if (config_.type === 'x') {
        root_.attr('transform', 'translate(0,' + (config_.height) + ')');
      }

      axis.update();
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

      // remove axis line
      root_.selectAll('.domain')
        .attr({
          'stroke': 'none'
        });

      return axis;
    };

    obj.extend(axis, config(axis, config_, ['id']));
    return axis();
  };

});
