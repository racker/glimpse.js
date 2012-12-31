define([
  'd3',
  'core/component/component'
],
function (d3, component) {
  'use strict';

  var legendProto,
    keys = [];

  legendProto = component.extend({

    init: function () {
      component.init.apply(this, arguments);
      this.config({
        'isFramed': false,
        'marginLeft': 0,
        'marginTop': 0,
        'radius': 5,
        'spacing': 20,
        'textColor': '#000'
      });
      return this;
    },

    // doesn't use data
    data: function () {
      return undefined;
    },

    render: function (selection) {
      var previousX;

      if (selection) {
        this.selection = selection.append('g')
          .attr({
            'class': 'component legend id-' + this.id
          });
      }

      previousX = this.marginLeft;
      keys.forEach(function (key) {
        var group, text, circle;
        group = this.selection.append('g')
          .attr({
            'transform': 'translate(' + previousX + ')'
          });
        text = group.append('text')
          .text(key.text)
          .attr({
            'x': this.radius * 2,
            'y': this.marginTop,
            'stroke': 'none',
            'fill': this.textColor,
            'text-anchor': 'start'
          });
        circle = group.append('circle')
          .attr({
            'stroke': 'none',
            'fill': key.color,
            'r': this.radius,
            'cy': Math.max(this.marginTop - this.radius, 0)
          });
        previousX += text[0][0].scrollWidth + this.spacing;
      }, this);
    },

    addKey: function (text, color) {
      keys.push({ text: text, color: color });
    }

  });

  return legendProto;
});
