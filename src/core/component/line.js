define([
  'd3',
  'core/component/component'
],
function (d3, component) {
  'use strict';

  var lineProto;

  lineProto = component.extend({

    init: function () {
      component.init.apply(this, arguments);
      this.config({
        'selection': null,
        'isFramed': true,
        'xScale': null,
        'yScale': null,
        'strokeWidth': 1.5,
        'color': 'steelblue',
        'fillArea': false
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
        'class': 'component line'
      });

      // draw the line
      this.line = d3.svg.line()
        .x(function(d) {
          return that.xScale(that.x(d));
        })
        .y(function(d) {
          return that.yScale(that.y(d));
        })
        .interpolate('linear');

      this.selection.append('path')
        .data([data])
        .attr({
          'stroke-width': this.strokeWidth,
          'stroke': this.color,
          'fill': 'none',
          'opacity': 1,
          'd': this.line
        });

      // optionally draw the area
      if (this.fillArea) {
        this.area = d3.svg.area()
          .x(function(d) {
            return that.xScale(that.x(d));
          })
          .y1(function(d) {
            return that.yScale(that.y(d));
          })
          .y0(this.height);

        this.selection.append('path')
          .data([data])
          .attr({
            'stroke': 'none',
            'fill': this.color,
            'opacity': 0.4,
            'd': this.area
          });
      }

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

  return lineProto;
});
