define([
  'd3',
  'obj/obj',
  'util/array'
],
function (d3, obj, array) {
  'use strict';

  var scalesProto = obj.extend({

    init: function () {
      this.scales = [];
      return this;
    },

    update: function () {
      return this;
    },

    add: function (id, scale) {
      this.scales.push({ id: id, scale: scale });
      return this;
    },

    get: function (id) {
      return array.find(this.scales, function (scale) {
        return scale.id === id;
      });
    }
  });

  return scalesProto;
});
