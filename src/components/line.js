/**
 * @fileOverview
 * Reusuable line component.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/string'
],
function (array, config, obj, string) {
  'use strict';

  return function () {

    var config_ = {},
      defaults_,
      x_,
      y_,
      data_,
      root_;

    /**
     * Default X data accessor function.
     * TODO: move to common location.
     */
    x_ = function(d) {
      return d.x;
    };

    /**
     * Default Y data accessor function.
     * TODO: move to common location.
     */
    y_ = function(d) {
      return d.y;
    };

    defaults_ = {
      id: string.random(),
      isFramed: true,
      strokeWidth: 1,
      color: 'steelBlue',
      showInLegend: true,
      lineGenerator: d3.svg.line(),
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
      var dataConfig = line.data(),
          x = dataConfig.x || x_,
          y = dataConfig.y || y_;

      // Configure the lineGenerator function
      config_.lineGenerator
        .x(function(d, i) {
          return config_.xScale(x(d, i));
        })
        .y(function(d, i) {
          return config_.yScale(y(d, i));
        })
        .interpolate(config_.interpolate);

      root_.select('.gl-line')
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
      root_ = selection.append('g')
        .attr({
          'id': config_.id,
          'class': 'gl-component gl-line'
        });

      root_.append('path')
        .attr('class', 'gl-line');
      line.update();

      return line;
    };

    obj.extend(line, config(line, config_,
      [
        'id',
        'xScale',
        'yScale',
        'lineGenerator'
      ]
    ));

    return line();

  };
});
