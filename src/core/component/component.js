define([
  'obj/obj'
],
function (obj) {
  'use strict';

  var componentProto,
    dataset;

  componentProto = obj.extend({

    init: function () {
      this.config({
        'position': 'topLeft'
      });
      // valid position values:
      // topLeft, topCenter, topRight
      // bottomLeft, bottomCenter, bottomRight
      // leftMiddle, rightMiddle, center
    },

    data: function (data) {
      if (!data) {
        return dataset[this.dataId];
      }
      dataset = data;
      return this;
    },

    render: function () {
      // noop
      // TODO: recursively render all contained components?
    },

    update: function () {
      // noop
    },

    destroy: function () {
      // noop
    }

  });

  return componentProto;
});
