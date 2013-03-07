/**
 * @fileOverview
 * d3 Selection group backgroundColor helpers.
 */
define(['d3'], function(d3) {
  'use strict';

  /**
   * d3 selection backgroundColor
   * Sets the fill attr for the node and
   *   sets the gl-background-color attribute.
   */
  d3.selection.prototype.backgroundColor = function(color) {
    var rect;

    if (this.node().tagName === 'g') {
      rect = this.select('.gl-layout-size');
      if (rect.empty()) {
        this.size(this.width(), this.height());
        rect = this.select('.gl-layout-size');
      }
      rect.attr('fill', color);
      this.attr('gl-background-color', color);
    }
    return this;
  };

  return d3;
});
