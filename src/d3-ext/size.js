/**
 * @fileOverview
 * d3 Selection group size helpers.
 */
define(['d3'], function(d3) {
  'use strict';

  /**
   * d3 selection width
   * Returns width attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-width' attribute, if it's defined.
   *   else it returns the bounding box width.
   */
  d3.selection.prototype.width = function() {
    var width = this.attr('gl-width');
    if (width) {
      return parseInt(width, 10);
    }
    return this.node().getBBox().width;
  };

  /**
   * d3 selection height
   * Returns height attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-height' attribute, if it's defined.
   *   else it returns the bounding box height.
   */
  d3.selection.prototype.height = function() {
    var height = this.attr('gl-height');
    if (height) {
      return parseInt(height, 10);
    }
    return this.node().getBBox().height;
  };

  /**
   * d3 selection size
   * If element is a group,
   *   it sets the gl-width and gl-height attributes.
   * else it returns width and height attribute of the element.
   */
  d3.selection.prototype.size = function(width, height) {
    var rect;

    if (this.node().tagName === 'g') {
      rect = this.select('.gl-layout-size');

      if (rect.empty()) {
        rect = this.append('rect');
      }

      rect.attr({
        'class': 'gl-layout-size',
        width: width,
        height: height,
        fill: 'none'
      });

      this.attr({ 'gl-width': width, 'gl-height': height });
    } else {
      this.attr({ width: width, height: height });
    }
    return this;
  };

  return d3;
});
