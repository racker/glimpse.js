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
        'fillArea': false,
        'interpolate': 'linear',
        'animationDuration': 500
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
        .interpolate(this.interpolate);

      this.selection.append('path')
        .data([data])
        .attr({
          'class': 'line',
          'stroke-width': this.strokeWidth,
          'stroke': this.color,
          'fill': 'none',
          'opacity': 1
        });

      // animate the drawing in
      function animate (selection, pathFunc) {
        var endIndex = 1,
            len = data.length -1,
            step = 1,
            totalDuration = that.animationDuration,
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

      animate(this.selection.select('.line'), this.line);

      // optionally draw the area
      if (this.fillArea) {
        this.area = d3.svg.area()
          .x(function(d) {
            return that.xScale(that.x(d));
          })
          .y1(function(d) {
            return that.yScale(that.y(d));
          })
          .y0(this.height)
          .interpolate(this.interpolate);

        this.selection.append('path')
          .data([data])
          .attr({
            'class': 'area',
            'stroke': 'none',
            'fill': this.color,
            'opacity': 0.4
          });
        animate(this.selection.select('.area'), this.area);
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
