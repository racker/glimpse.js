/**
 * @fileOverview
 * Mixin to provide observalbe evented behavior for any object.
 */
define([
  'd3',
  'util/obj',
  'util/array'
],
function (d3, obj, array) {
  'use strict';

  return function (context) {
    return obj.empty({

      registerEvents: function (eventsTypes) {
        context.dispatcher = d3.dispatch.apply(undefined, eventsTypes);
      },

      on: function (eventType, handler) {
        context.dispatcher.on(eventType, handler);
      },

      unlisten: function (eventType) {
        context.dispatcher.on(eventType, null);
      },

      fire: function (eventType) {
        var args = array.convertArgs(arguments, 1);
        context.dispatcher[eventType].apply(context, args);
      }

    });
  };
});
