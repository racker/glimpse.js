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
        marginLeft: 0,
        opacity: 0.8,
        radius: 4
      };

    /**
     * The main function that gets returned.
     */
    function scatterChart(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      return scatterChart;
    }

    scatterChart.data = function (data) {
      if (data) {
        data_ = data;
        return scatterChart;
      }
      return data_[config_.dataId];
    };

   scatterChart.update = function () {
   };

   scatterChart.render = function (selection) {
       data_ = this.data();
      selection_ = selection.append('g')
        .attr({
          'class': 'component scatter'
        })
        .selectAll('circle')
          .data(data_)
          .enter()
          .append('circle')
          .attr({
            'stroke': 'none',
            'fill': config_.color,
            'opacity': config_.opacity,
            'r': config_.radius,
            'cx': function (d) {
              return config_.xScale(config_.x(d));
            },
            'cy': function (d) {
              return config_.height - config_.yScale(config_.y(d));
            }
          });
      return scatterChart;
    };

    /**
     * Mixin other public functions.
     */
    obj.extend(scatterChart,
      configurable(scatterChart, config_, ['width', 'height']));

    return scatterChart(defaults);
  };

});
