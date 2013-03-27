/**
 * @fileOverview
 * Utility selector to select a single node which has an attr with a
 *   certain value.
 */
define([
  'd3'
],
function(d3) {
  'use strict';

  /**
   * Selects a sub-selection of the current selection which is the first
   *   node that has a matching attr and value.
   * @param attr The attribute to check.
   * @param value The value that attr must have set.
   * @return {d3.selection}
   */
  d3.selection.prototype.selectAttr = function(attr, value) {
    return this.select('[' + attr + '="' + value + '"]');
  };

  return d3;
});
