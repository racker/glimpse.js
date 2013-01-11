define([
  'core/object',
  'core/array',
  'core/config'
],
function (obj, array, config) {
  'use strict';

  return function () {

    var config_ = {},
      defaults_ = {
        isFramed: true,
        strokeWidth: 1
      },
      lineGenerator_,
      data_;

    function line() {
      obj.extend(config_, defaults_);
      lineGenerator_ = d3.svg.line();
      return line;
    }

    line.data = function (data) {
      if (data) {
        data_ = data;
        return line;
      }
      return array.find(data_, function (d) {
        return d.id === config_.dataId;
      });
    };

    line.render = function (selection) {
      var lineGroup,
          dataConfig = line.data();

       lineGroup = selection.append('g')
        .attr({
          'class': 'component line-chart'
        });

      // draw the line
      lineGenerator_ = d3.svg.line()
        .x(function(d) {
          return config_.xScale(dataConfig.x(d));
        })
        .y(function(d) {
          return config_.yScale(dataConfig.y(d));
        })
        .interpolate(config_.interpolate);

      lineGroup.append('path')
        .datum(dataConfig.data)
        .attr({
          'class': 'line',
          'stroke-width': config_.strokeWidth,
          'stroke': dataConfig.color,
          'fill': 'none',
          'opacity': 1,
          'd': lineGenerator_
        });

      return line;
    };

    obj.extend(line, config(line, config_, []));
    return line();
  };

});
