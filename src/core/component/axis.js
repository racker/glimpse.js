define([
  'd3',
  'core/component/component'
],
function (d3, component) {
  'use strict';

  var axis;

  axis = component.extend({

    init: function () {
      component.init.apply(this, arguments);
      this.d3axis = d3.svg.axis();
      this.config({
        'color': '#666',
        'selection': null,
        'isFramed': true,
        'xScale': null,
        'yScale': null,
        'type': null
      });
      return this;
    },

    // doesn't use data
    data: function () {
      return undefined;
    },

    scale: function (scale) {
      this.d3axis.scale(scale);
      return this;
    },

    render: function (selection) {

      if (selection) {
        this.selection = selection.append('g')
          .attr({
            'class': 'axis ' + this.type + '-axis ' + this.id,
            'stroke': this.color,
            'fill': 'none',
            'shape-rendering': 'crispEdges',
            'stroke-width': 1,
            'font-family': 'sans-serif',
            'font-size': '11'
          });
      }

      this.d3axis
        .orient(this.orient);

      if (this.type === 'x') {
        this.d3axis
          .scale(this.xScale)
          .ticks(d3.time.minutes, 15);
        this.selection.attr('transform', 'translate(0,' + (this.height) + ')');
      } else if (this.type === 'y') {
        this.d3axis.scale(this.yScale);
      }

      // render the axis
      this.selection.call(this.d3axis);

      // remove boldness from default axis path
      this.selection.selectAll('path')
        .attr({
          'fill': 'none'
        });
      // update fonts
      this.selection.selectAll('text')
        .attr({
          'stroke': 'none',
          'fill': this.color
        });


      return this;
    }

  });

  return axis;
});
