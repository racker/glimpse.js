/**
 * @fileOverview
 * d3 Selection group border helpers.
 */
define([
  'd3',
  'core/array'
], function(d3, array) {
  'use strict';
  var DEFAULTS;

  DEFAULTS = {
    color: '#000',
    style: 'solid',
    width: [0, 0, 0, 0],
    dasharrayDotted: [1,1],
    dasharrayDashed: [5,5],
    lineBorderClassName: 'gl-line-border',
    sizingRectClassName: 'gl-layout-size'
  };

  /**
   * Computes the stroke-dasharray value
   *   https://developer.mozilla.org/en-US/docs/SVG/Attribute/stroke-dasharray
   * @param  {d3.selection} node
   * @param  {Object} borderInfo  Contains
   *  {style: borderStyle, color: borderColor, width: [t, r, b, l]}
   */
  function getStrokeDashArray(node, borderInfo) {
    var stroke = [], t, r, b, l, height, width;

    if (borderInfo.style === 'solid') {
      t = !!borderInfo.width[0];
      r = !!borderInfo.width[1];
      b = !!borderInfo.width[2];
      l = !!borderInfo.width[3];
      height = node.height();
      width = node.width();

      if (t) {
        stroke.push(width);
      } else {
        stroke = stroke.concat([0, width]);
      }

      if (r && lengthModTwo(stroke) !== 0 || !r && lengthModTwo(stroke) === 0) {
        stroke.push(0);
      }
      stroke.push(height);

      if (b && lengthModTwo(stroke) !== 0 || !b && lengthModTwo(stroke) === 0) {
        stroke.push(0);
      }
      stroke.push(width);

      if (l && lengthModTwo(stroke) !== 0 || !l && lengthModTwo(stroke) === 0) {
        stroke.push(0);
      }
      stroke.push(height);

    } else {
      //TODO: accept dasharray
      stroke = (borderInfo.style === 'dotted') ?
        DEFAULTS.dasharrayDotted : DEFAULTS.dasharrayDashed;
    }
    return stroke;
  }

  /**
   * Computes the stroke-width attribute
   * @param {Array} width , r, b, l] value array of border-width
   */
  function getStrokeWidth(width) {
    var strokeWidth = 1;

    if (!!width[0]) {
      strokeWidth = parseInt(width[0], 10);
    } else if (!!width[1])  {
      strokeWidth = parseInt(width[1], 10);
    } else if (!!width[2]) {
      strokeWidth = parseInt(width[2], 10);
    } else if (!!width[3]) {
      strokeWidth = parseInt(width[3], 10);
    }

    return strokeWidth;
  }

  /**
   * Computes the class name for border
   * @param  {string} style    Style of the border
   * @param  {string} subClass Subclass to append
   * @return {string} class name for border
   */
  function getBorderClass(style, subClass) {
    return 'gl-' + style + '-border-' + subClass;
  }

  /**
   * Computes arr.length % 2
   * @param  {Array} arr
   * @return {integer}
   */
  function lengthModTwo(arr) {
    return arr.length % 2;
  }

  /**
   * Adds svg line element based on the coordinates array
   * @param  {d3.selection} node
   * @param  {Object} lineInfo
   */
  function addBorder(node, lineInfo) {
    var  className, dasharray, line;

    className = getBorderClass(lineInfo.style, lineInfo.subClass);
    dasharray = getStrokeDashArray(node, lineInfo);
    line = node.select('.' + className);

    if (line.empty()) {
      line = node.append('line');
    }

    line.attr({
      x1: lineInfo.x1,
      y1: lineInfo.y1,
      x2: lineInfo.x2,
      y2: lineInfo.y2,
      'class': className + ' ' + DEFAULTS.lineBorderClassName,
      'stroke': lineInfo.color,
      'stroke-width': lineInfo.width,
      'stroke-dasharray': dasharray.toString()
    });
  }

  /**
   * Applies solid border node by setting the
   * stroke-dasharray attribute on the rect inside
   * the node.
   * @param  {d3.selection} node
   * @param  {Object} borderInfo Contains
   *  {style: borderStyle, color: borderColor, width: [t, r, b, l]}
   */
  function applyRectBorder(node, borderInfo) {
    var strokeDashArray;

    strokeDashArray = getStrokeDashArray(node, borderInfo);

    node.attr({
      'stroke': borderInfo.color,
      'stroke-width': getStrokeWidth(borderInfo.width),
      'stroke-dasharray': strokeDashArray.toString()
    });
  }

  /**
   * Applies styled border to the node by
   * adding svg line elements.
   * @param  {d3.selection} node
   * @param  {Object} borderInfo Contains
   *  {style: borderStyle, color: borderColor, width: [t, r, b, l]}
   */
  function applyBorder(node, borderInfo) {
    //TODO: append this to the object
    var lineInfo = {
      color: borderInfo.color,
      style: borderInfo.style
    };

    if (!!borderInfo.width[0]) {
      lineInfo = {
        x1: 0,
        y1: 0,
        x2: node.width(),
        y2: 0,
        subClass: 'top',
        width: borderInfo.width[0],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[1]) {
      lineInfo = {
        x1: node.width(),
        y1: 0,
        x2: node.width(),
        y2: node.height(),
        subClass: 'right',
        width: borderInfo.width[1],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[2]) {
      lineInfo = {
        x1: 0,
        y1: node.height(),
        x2: node.width(),
        y2: node.height(),
        subClass: 'bottom',
        width: borderInfo.width[2],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[3]) {
      lineInfo = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: node.height(),
        subClass: 'left',
        width: borderInfo.width[3],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }
  }

  /**
   * Removes any existing borders
   * @param  {d3.selection} node
   */
  function removeExistingBorders(node) {
    node.selectAll('.' + DEFAULTS.lineBorderClassName)
      .remove();

    node.select('.' + DEFAULTS.sizingRectClassName)
      .attr('stroke-dasharray', null);
  }

  /**
   * d3 selection border
   * @param  {string} style Border style
   * @param  {color} color Border color
   * @param  {Array} width [t, r, b, l] value array of border-width
   */
  d3.selection.prototype.border = function border(style, color, width) {
    var rect, borderInfo;

    rect = this.select('.' + DEFAULTS.sizingRectClassName);

    if (!rect.empty()) {
      borderInfo = {
        style: style || DEFAULTS.style,
        color: color || DEFAULTS.color,
        width: array.getArray(width) || DEFAULTS.width
      };

      removeExistingBorders(this);

      if (style === 'solid') {
        applyRectBorder(rect, borderInfo);
      } else {
        applyBorder(this, borderInfo);
      }

      this.attr({
        'gl-border-color': borderInfo.color,
        'gl-border-style': borderInfo.style,
        'gl-border-width': borderInfo.width.toString()
      });
    }

    return this;
  };

  return d3;
});
