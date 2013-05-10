/**
 * @fileOverview
 * Difference quotient.
 */
define([
  'core/object',
  'core/string',
  'data/functions',
  'data/selection/selection'
], function (obj, string, dataFns, selection) {
  'use strict';

  var selectionPrototype = selection.getSelectionPrototype(),
      TIME_INTERVAL;

  /**
   * @const
   * @enum{string}
   * TODO: Move after creation of a constants file.
   */
  TIME_INTERVAL = {
    SECOND: 1000,
    MINUTE: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24
  };

  /**
   * Calculates the difference quotient on the data
   * TODO: Should accept dimension on which to work on.
   * @param {Object?} options
   * @param {(string|number)?} options.interval Optional interval specified as
   *   number or string such as second, minute, hour or day.
   */
  selectionPrototype.diffQuotient = function (options) {
    var data, mutatedData, interval,
        prevX, prevY, curX, curY, slope;
    options = options || {};
    interval = options.interval || 1;
    if (string.isString(interval)) {
      interval = TIME_INTERVAL[options.interval.toUpperCase()];
    }
    return this.map(function(source) {
      var r = {};
      data = source.data;
      mutatedData = [];
      data.forEach(function(d, i) {
        curX = dataFns.dimension(source, 'x')(d);
        curY = dataFns.dimension(source, 'y')(d);
        if (i !== 0) {
          slope = (curY - prevY) / (curX - prevX);
          mutatedData.push({
            x: curX,
            y: slope * interval
          });
        }
        prevX = curX;
        prevY = curY;
      });
      obj.extend(r, source);
      r.data = mutatedData;
      r.dimensions = {  x: 'x', y: 'y' };
      return r;
    });
  };

});
