/**
 * @fileOverview
 * d3 Selection position helpers.
 */
define([
  'd3',
  'core/function'
], function(d3, fn) {
  /*jshint validthis: true */
  'use strict';

  function getPosition(pos, node, parent) {
    var x = 0, y = 0;
    switch(pos) {
      case 'center':
        x = (parent.width() - node.width())/2;
        y = (parent.height() - node.height())/2;
      break;
      case 'center-top':
        x = (parent.width() - node.width())/2;
        y = 0;
      break;
      case 'center-bottom':
        x = (parent.width() - node.width())/2;
        y = parent.height() - node.height();
      break;
      case 'center-left':
        y = (parent.height() - node.height())/2;
      break;
      case 'center-right':
        x = parent.width() - node.width();
        y = (parent.height() - node.height())/2;
      break;
      case 'top-left':
      break;
      case 'top-right':
        x = parent.width() - node.width();
      break;
      case 'bottom-left':
        y = parent.height() - node.height();
      break;
      case 'bottom-right':
        x = parent.width() - node.width();
        y = parent.height() - node.height();
      break;
    }
    return [x, y];
  }

  /**
   * Positions an element with respect to its parent.
   * Position may be: center, top-left, top-right, bottom-left etc
   * Also takes the position offsets for x and y axis.
   */
  function position(pos, offsetX, offsetY) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    this.each(function() {
      var node = d3.select(this),
          parent = d3.select(this.parentNode),
          x, y, posXY;
      posXY = getPosition(pos, node, parent);
      x = posXY[0] + offsetX;
      y = posXY[1] + offsetY;
      if (this.tagName === 'g') {
        node.attr('transform', 'translate(' + [x, y] +')');
      } else {
        node.attr({ x: x, y: y });
      }
    });
    return this;
  }

  d3.selection.prototype.position = position;

  /**
   * Centers the selected element(s). Also takes offsets for
   * x and y axis.
   */
  d3.selection.prototype.center = fn.partial(position, 'center');

  return d3;
});
