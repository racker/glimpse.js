define([
  'd3',
  'obj/obj',
  'core/layer/layer'
],
function (d3, obj, layer) {
  'use strict';

  var barLayer;

  barLayer = {

    init: function () {
    },

    create: function () {
      var newObj = obj.create(this);
      return newObj;
    },

    render: function (el) {
      var dataSubset = this.dataAccessor(this.dataset),
      conf = this;
      el.selectAll('rect')
        .data(dataSubset)
        .enter()
        .append('rect')
        .attr({
          'width': 10,
          'height': 10,
          'fill': conf.fill,
          'x': function (d) { return conf.x(d) * 10; },
          'y': function (d) { return conf.y(d) * 10; }
        });
    }

  };

  return barLayer;

});
