/**
 * @fileOverview
 * Reusuable line component.
 */
define([
  'core/object',
  'core/array',
  'core/config'
],
function (obj, array, config) {
  'use strict';

  return function () {

    var config_ = {},
      defaults_,
      x_,
      y_,
      lineGenerator_,
      data_,
      root_;

    x_ = function(d) {
      return config_.xScale(d.x);
    };

    y_ = function(d) {
      return config_.yScale(d.y);
    };

    defaults_ = {
      isFramed: true,
      strokeWidth: 1,
      color: 'steelBlue',
      showInLegend: true,
      lineGenerator: d3.svg.line(),
      x: x_,
      y: y_,
      interpolate: 'linear'
    };

    function line() {
      obj.extend(config_, defaults_);
      return line;
    }

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    line.data = function (data) {
      if (data) {
        data_ = data;
        return line;
      }
      return array.find(data_, function (d) {
        return d.id === config_.dataId;
      });
    };

    line.update = function () {
      var dataConfig = line.data();

      // Configure the lineGenerator function
      config_.lineGenerator
        .x(config_.x)
        .y(config_.y)
        .interpolate(config_.interpolate);

      root_.select('.line')
        .datum(dataConfig.data)
        .attr({
          'stroke-width': config_.strokeWidth,
          'stroke': config_.color,
          'fill': 'none',
          'opacity': 1,
          'd': config_.lineGenerator
        });

      return line;
    };

    line.render = function (selection) {
      var dataConfig = line.data();

      root_ = selection.append('g')
        .attr({
          'class': 'component line-chart'
        });

      root_.append('path')
        .attr('class', 'line');
      line.update();

      return line;
    };

    obj.extend(line, config(line, config_,
      [
        'xScale',
        'yScale',
        'lineGenerator',
        'x',
        'y'
      ]
    ));

    return line();

  };
});
