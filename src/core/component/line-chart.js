/**
 * @fileOverview
 *
 * A line chart component.
 */
define([
  'd3',
  'util/obj',
  'mixins/configurable'
],
function (d3, obj, configurable) {
  'use strict';

  return function (defaults) {

    /**
     * Private variables
     */
    var defaults_ = {
        'selection': null,
        'isFramed': true,
        'xScale': null,
        'yScale': null,
        'strokeWidth': 1.5,
        'color': 'steelblue',
        'fillArea': false,
        'interpolate': 'linear',
        'animationDuration': 500
      },
      data_,
      config_ = obj.empty(),
      line_,
      area_;

    /**
     * The main function.
     */
    function lineChart(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      return lineChart;
    }

    /**
     * Private functions
     */

    // animate the drawing in
    function animate (selection, pathFunc, data) {
      var endIndex = 1,
          len = data.length -1,
          step = 1,
          totalDuration = config_.animationDuration,
          stepDuration = Math.floor(totalDuration / len),
          intervalId;

      function draw (endIndex) {
        selection.call(function (d) {
          // this: path selection
          this.attr('d', function (d) {
              return pathFunc(d.slice(0, endIndex + 1));
            });
        });
      }

      intervalId = setInterval(function () {
        draw(endIndex);
        endIndex += step;
        if (endIndex >= len) {
          draw(len);
          clearInterval(intervalId);
        }
      }, stepDuration);
    }

    function renderArea(selection) {
      area_ = d3.svg.area()
        .x(function(d) {
          return config_.xScale(config_.x(d));
        })
        .y1(function(d) {
          return config_.yScale(config_.y(d));
        })
        .y0(config_.height)
        .interpolate(config_.interpolate);

      selection.append('path')
        .datum(lineChart.data())
        .attr({
          'class': 'area',
          'stroke': 'none',
          'fill': config_.color,
          'opacity': 0.4
        });
      animate(selection.select('.area'), area_, lineChart.data());
    }


    /**
     * Public methods on the main function.
     */

    lineChart.data = function (data) {
      if (data) {
        data_ = data;
        return lineChart;
      }
      return data_[config_.dataId];
    };

    lineChart.render = function (selection) {
      var data = lineChart.data(),
          lineGroup;

       lineGroup = selection.append('g')
        .attr({
          'class': 'component line-chart'
        });

      // draw the line
      line_ = d3.svg.line()
        .x(function(d) {
          return config_.xScale(config_.x(d));
        })
        .y(function(d) {
          return config_.yScale(config_.y(d));
        })
        .interpolate(config_.interpolate);

      lineGroup.append('path')
        .datum(data)
        .attr({
          'class': 'line',
          'stroke-width': config_.strokeWidth,
          'stroke': config_.color,
          'fill': 'none',
          'opacity': 1
        });

      animate(lineGroup.select('.line'), line_, data);

      // optionally draw the area
      if (config_.fillArea) {
        renderArea(lineGroup);
      }
      return lineChart;
    };

    /**
     * Mixin other public functions.
     */
    obj.extend(lineChart,
      configurable(lineChart, config_, ['width', 'height', 'x', 'y']));

    return lineChart(defaults);
  };

});
