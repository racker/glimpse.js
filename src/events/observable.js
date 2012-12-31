/**
 * @fileOverview
 * Mixin to provide observalbe evented behavior for any object.
 */

define([
  'd3',
  'obj/obj'
],
function (d3, obj) {
  'use strict';

  var ObservableMixin;
  ObservableMixin = obj.empty({

    registerEvents: function (eventsTypes) {
      this.dispatcher = d3.dispatch.apply(undefined, eventsTypes);
    },

    on: function (eventType, handler) {
      this.dispatcher.on(eventType, handler);
    },

    unlisten: function (eventType) {
      this.dispatcher.on(eventType, null);
    },

    fire: function (eventType) {
      var args = Array.prototype.slice.call(arguments, 1);
      this.dispatcher[eventType].apply(this, args);
    }

  });

  return ObservableMixin;
});
