/**
 * @fileOverview
 *
 * A legend component to display series info.
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
    var defaults_= {
        'isFramed': false,
        'marginLeft': 0,
        'marginTop': 0,
        'radius': 5,
        'spacing': 20,
        'textColor': '#000'
      },
      config_ = obj.empty(),
      keys_ = [];

    /**
     * Private functions
     */


    /**
     * The main function.
     */
    function legend(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      return legend;
    }

    /**
     * Public methods on the main function.
     */
    legend.addKey = function (text, color) {
      keys_.push({ text: text, color: color });
      return legend;
    };

    legend.update = function () {
      return legend;
    };

    legend.render = function (selection) {
      var mySelection, previousX;

      mySelection = selection.append('g')
        .attr({
          'class': 'component legend id-' + config_.id
        });

      previousX = config_.marginLeft;
      keys_.forEach(function (key) {
        var group, text, circle;
        group = mySelection.append('g')
          .attr({
            'transform': 'translate(' + previousX + ')'
          });
        text = group.append('text')
          .text(key.text)
          .attr({
            'x': config_.radius * 4,
            'y': config_.marginTop,
            'stroke': 'none',
            'fill': config_.textColor,
            'text-anchor': 'start'
          });
        circle = group.append('circle')
          .attr({
            'stroke': 'none',
            'fill': key.color,
            'r': config_.radius,
            'cx': config_.radius * 2,
            'cy': Math.max(config_.marginTop - config_.radius, 0)
          });
        previousX += text[0][0].scrollWidth + config_.spacing;
      });
    };

    /**
     * Mixin other public functions.
     */
    obj.extend(legend,
      configurable(legend, config_, ['width', 'height']));

    return legend(defaults);
  };

});
