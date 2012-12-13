define([
  'd3',
  'obj/obj'
  //'core/layer/bar'
],
function (d3, obj, barLayer) {
  'use strict';

  var layer;

  layer = {

    init: function () {
      this.config = {};
    },


    data: function (dataset) {
      this.dataset = dataset;
    },

    // TODO: move somewhere else and make reusable
    config: function (name, value) {
      if (!value) {
        return this[name];
      }
      this[name] = value;
      return this;
    }

  };

  return layer;

});
