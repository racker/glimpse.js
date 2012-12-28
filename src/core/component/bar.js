define([
  'd3',
  'core/component/component'
],
function (d3, component) {
  'use strict';

  var barProto;

  barProto = component.extend({

    init: function () {
      component.init.apply(this, arguments);
      this.config({
        'selection': null,
        'isFramed': true,
        'xScale': null,
        'yScale': null
      });
      return this;
    },

    render: function (selection) {
      var that = this,
           data = this.data(),
           barWidth = 4;

      if (selection) {
        this.selection = selection.append('g');
      }
      this.selection.attr({
        'class': 'component bar'
      });

      this.selection.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr({
          'width': barWidth,
          'fill': this.color,
          'shape-rendering': 'crispEdges',
          'opacity': 0.5,
          'height': function (d) {
            return that.yScale(that.y(d));
          },
          'x': function (d) {
            return that.xScale(that.x(d));
          },
          'y': function (d) {
            return that.height - that.yScale(that.y(d));
          }
        });
      return this;
    },

    // defaults, may be overridden
    x: function (d, i) {
      return d.x;
    },

    y: function (d, i) {
      return d.y;
    }

  });

  return barProto;
});
