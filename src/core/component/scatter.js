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
        'yScale': null,
        'radius': 5,
        'opacity': 0.8
      });
      return this;
    },

    render: function (selection) {
      var that = this,
           data = this.data();

      if (selection) {
        this.selection = selection.append('g');
      }
      this.selection.attr({
        'class': 'component scatter'
      });

      this.selection.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr({
          'stroke': 'none',
          'fill': this.color,
          'opacity': this.opacity,
          'r': this.radius,
          'cx': function (d) {
            return that.xScale(that.x(d));
          },
          'cy': function (d) {
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
