/**
 * @fileOverview
 * d3 Selection group size helpers.
 */
define(['d3'], function(d3) {
  'use strict';

  /**
   * Determines if the selection's node is a <g> node.
   * @param {d3.selection} selection
   * @return {Boolean}
   */
  function isGnode(selection) {
    return !selection.empty() && selection.node().tagName === 'g';
  }

  /**
   * Appends a layout rect if it doesn't exist, otherwise returns
   *   the existing one.
   * @param {d3.selection} selection
   * @return {d3.selection}
   */
  function lazyAddLayoutRect(selection) {
    var layoutRect;

    layoutRect = selection.select('.gl-layout');
    if (layoutRect.empty()) {
      layoutRect = selection.append('rect')
        .attr({
          class: 'gl-layout',
          fill: 'none'
        });
    }
    return layoutRect;
  }

  /**
   * d3 selection width
   * Returns width attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-width' attribute, if it's defined.
   *   else it returns the bounding box width.
   * @param {Number} w
   * @return {Number|d3.selection}
   */
  d3.selection.prototype.width = function(w) {
    var width, nonGnode;

    // Getting.
    if (!arguments.length) {
      width = this.attr('gl-width');
      if (width) {
        return parseFloat(width);
      }
      return this.node().getBBox().width;
    }
    // Setting.
    if (isGnode(this)) {
      this.attr({
        'gl-width': w
      });
      nonGnode = lazyAddLayoutRect(this);
    } else {
      nonGnode = this;
    }
    nonGnode.attr({
      width: w
    });
    return this;
  };

  /**
   * d3 selection height
   * Returns height attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-height' attribute, if it's defined.
   *   else it returns the bounding box height.
   * @param {Number} h
   * @return {Number|d3.selection}
   */
  d3.selection.prototype.height = function(h) {
    var height, nonGnode;

    // Getting.
    if (!arguments.length) {
      height = this.attr('gl-height');
      if (height) {
        return parseFloat(height);
      }
      return this.node().getBBox().height;
    }
    // Setting.
    if (isGnode(this)) {
      this.attr({
        'gl-height': h
      });
      nonGnode = lazyAddLayoutRect(this);
    } else {
      nonGnode = this;
    }
    nonGnode.attr({
      height: h
    });
    return this;
  };

  /**
   * d3 selection size
   * If element is a group,
   *   it sets the gl-width and gl-height attributes.
   * else it returns width and height attribute of the element.
   *
   * @param {Number} width
   * @param {Number} height
   * @return {Array|d3.selection}
   */
  d3.selection.prototype.size = function(width, height) {
    // No args, return current width/height.
    if (!arguments.length) {
      return [
        this.width(),
        this.height()
      ];
    }
    // Has args, set width/height.
    return this.width(width).height(height);
  };

  return d3;
});
