/**
 * @fileOverview
 * Creates a default d3.dispatch with common component events.
 * Optionally can provide additional events.
 */
define(function() {
  'use strict';

  /**
   * List of event names common to all components.
   * @const
   */
  var COMMON_EVENTS = [
    'render',
    'update',
    'show',
    'hide',
    'destroy'
  ];

  /**
   * Creates a d3 event dispatcher with common events by default.
   * Optionally supplied additional events will also be added.
   *
   * @public
   * @param {string} arguments Any other event names to add.
   * @return {d3.dispatch}
   * @see https://github.com/mbostock/d3/wiki/Internals#wiki-d3_dispatch
   */
  return function() {
    var eventNames;

    eventNames = COMMON_EVENTS;
    if (arguments.length) {
      eventNames = Array.prototype.concat.apply(eventNames, arguments);
    }
    return d3.dispatch.apply(null, eventNames);
  };

});
