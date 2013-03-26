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
    layoutRectClassName: 'gl-layout'
  };

  /**
   * Computes the stroke-dasharray value
   * @see
   *    https://developer.mozilla.org/en-US/docs/SVG/Attribute/stroke-dasharray
   * @param  {d3.selection} node
   * @param  {Object} borderInfo  Contains
   *  {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
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

      computeDashOrGap(stroke, r);
      stroke.push(height);

      computeDashOrGap(stroke, b);
      stroke.push(width);

      computeDashOrGap(stroke, l);
      stroke.push(height);

    } else {
      //TODO: accept dasharray
      stroke = (borderInfo.style === 'dotted') ?
        DEFAULTS.dasharrayDotted : DEFAULTS.dasharrayDashed;
    }
    return stroke;
  }

  /**
   * Computes if a gap needs to be added to the strokedasharray
   * @param  {Array}  stroke
   * @param  {Boolean} hasEdge
   */
  function computeDashOrGap(stroke, hasEdge) {
    var mod2 = stroke.length % 2;
    if (hasEdge && mod2 !== 0 || !hasEdge && mod2 === 0) {
      stroke.push(0);
    }
  }

  /**
   * Computes the class name for border
   * @param  {string} style  Style of the border <'solid'|'dashed'|'dotted'>
   * @param  {string} subClass Subclass to append class name
   * @return {string} class name for border
   */
  function getBorderClass(style, subClass) {
    return 'gl-' + style + '-border-' + subClass;
  }

  /**
   * Adds svg line element based on the coordinates array
   * @param  {d3.selection} node
   * @param  {Object} lineInfo
   *  contains
   *  {
   *    x1: x-axis coordinate of the start of the line,
   *    y1: y-axis coordinate of the start of the line,
   *    x2: x-axis coordinate of the end of the line,
   *    y2: y-axis coordinate of the end of the line,
   *    subClass: postfix for the class name on the line element,
   *    width: border width <percentage> | <length> | inherit,
   *    @see http://www.w3.org/TR/SVG/types.html#DataTypePercentage
   *    @see http://www.w3.org/TR/SVG/types.html#DataTypeLength
   *    color: border color <paint>
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint,
   *    style: border style <'solid'|'dashed'|'dotted'>
   *  }
   */
  function addBorder(node, lineInfo) {
    var  className, dasharray, line;

    className = getBorderClass(lineInfo.style, lineInfo.subClass);
    dasharray = lineInfo.style !== 'solid' ?
      getStrokeDashArray(node, lineInfo) : '';
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
   * Applies styled border to the node by
   * adding svg line elements.
   * @param  {d3.selection} node
   * @param  {Object} borderInfo Contains
   *  {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: [t, r, b, l] {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   */
  function applyBorder(node, borderInfo) {
    //TODO: append this to the object
    var width = 0, lineInfo;
    lineInfo = {
      color: borderInfo.color,
      style: borderInfo.style
    };

    if (!!borderInfo.width[0]) {
      width = borderInfo.width[0];
      lineInfo = {
        x1: 0,
        y1: width/2,
        x2: node.width(),
        y2: width/2,
        subClass: 'top',
        width: borderInfo.width[0],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[1]) {
      width = borderInfo.width[1];
      lineInfo = {
        x1: node.width() - width/2,
        y1: 0,
        x2: node.width() - width/2,
        y2: node.height(),
        subClass: 'right',
        width: borderInfo.width[1],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[2]) {
      width = borderInfo.width[2];
      lineInfo = {
        x1: 0,
        y1: node.height() - width/2,
        x2: node.width(),
        y2: node.height() - width/2,
        subClass: 'bottom',
        width: borderInfo.width[2],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[3]) {
      width = borderInfo.width[3];
      lineInfo = {
        x1: width/2,
        y1: 0,
        x2: width/2,
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

    node.select('.' + DEFAULTS.layoutRectClassName)
      .attr('stroke-dasharray', null);
  }

  /**
   * d3 selection border
   * @param  {string} style Border style <'solid'|'dotted'|'dashed'>
   * @param  {color} color Border color <paint>,
   * @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   * @param  {Array} width 4 element array where each element
   *  corresponding to border width of each edge top, right, bottom and left
   *  Value : <percentage> | <length> | inherit | 0
   *  0 represents no border
   */
  d3.selection.prototype.border = function border(style, color, width) {
    var rect, borderInfo;

    rect = this.select('.' + DEFAULTS.layoutRectClassName);

    if (!rect.empty()) {
      borderInfo = {
        style: style || DEFAULTS.style,
        color: color || DEFAULTS.color,
        width: array.getArray(width) || DEFAULTS.width
      };

      removeExistingBorders(this);
      applyBorder(this, borderInfo);

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

