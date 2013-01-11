/**
 * @fileOverview
 *
 * A bar chart component.
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
    var config_ = obj.empty(),
      data_,
      components_,
      selection_,
      defaults_ = {
        isFramed: true,
        height: 0,
        width: 0,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      };


    /**
     * Private functions
     */



    /**
     * The main function that gets returned.
     */
    function barChart(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      return barChart;
    }

    /**
     * Public methods on the main function object.
     */

    barChart.data = function (data) {
      if (data) {
        data_ = data;
        return barChart;
      }
      return data_[config_.dataId];
    };

    barChart.update = function () {
      return barChart;
    };

    barChart.render = function (selection) {
      var barWidth = 4;
      data_ = barChart.data();

      selection_ = selection.append('g')
        .attr({
          'class': 'component bar'
        })
        .selectAll('rect')
          .data(data_)
          .enter()
          .append('rect')
          .attr({
            'width': barWidth,
            'fill': config_.color,
            'shape-rendering': 'crispEdges',
            'opacity': 0.5,
            'height': function (d) {
              return config_.yScale(config_.y(d));
            },
            'x': function (d) {
              return config_.xScale(config_.x(d));
            },
            'y': function (d) {
              return config_.height - config_.yScale(config_.y(d));
            }
          });

      return barChart;
    };

    /**
     * Mixin other public functions.
     */
    obj.extend(barChart,
      configurable(barChart, config_, ['width', 'height']));

    return barChart(defaults);
  };

});
