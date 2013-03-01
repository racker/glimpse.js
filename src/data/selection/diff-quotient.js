/**
 * @fileOverview
 * Difference quotient.
 */
define([
  'core/object',
  'data/selection/selection'
], function (obj, selection) {
  'use strict';

  var selectionPrototype = selection.getSelectionPrototype(),
      TIME_INTERVAL;

  /**
   * @const
   * @enum{string}
   * TODO: Move after creation of a constants file.
   */
  TIME_INTERVAL = {
    DAY: 1000 * 60 * 60 * 24
  };

  /**
   * Calculates the difference quotient on the data
   * TODO: Should accept axis on which to work on.
   *       Time interval to calculate rate by.
   */
  selectionPrototype.diffQuotient = function () {
    var data, mutatedData,
        prevX, prevY, curX, curY, slope;
    return this.map(function(source) {
      var r = {};
      data = source.data;
      mutatedData = [];
      data.forEach(function(d, i) {
        curX = source.x(d);
        curY = source.y(d);
        if (i !== 0) {
          slope = (curY - prevY) / (curX - prevX);
          mutatedData.push({
            x: curX,
            y: slope * TIME_INTERVAL.DAY
          });
        }
        prevX = curX;
        prevY = curY;
      });
      obj.extend(r, source);
      r.data = mutatedData;
      r.x = function(d) { return d.x; };
      r.y = function(d) { return d.y; };
      return r;
    });
  };

});
