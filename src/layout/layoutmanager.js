/**
 * @fileOverview
 * Layout manager.
 */
define([
  'layout/layouts',
  'core/array'
],
function (layouts, array) {
  'use strict';

  function calculateDim(splits, length) {
    return splits.map(function(split) {
      return (parseInt(split, 10)/100) * length;
    });
  }

  function percent(number, percentage) {
    percentage = percentage || 1;
    return parseInt(number, 10) * (percentage/100);
  }

  function getPaddingContainer(node, nodeInfo) {
    var child, paddingLeft, paddingRight, paddingTop,
        paddingBottom, percentWidth, percentHeight;
    if (nodeInfo.padding) {
      paddingLeft = paddingRight = paddingTop =
        paddingBottom = nodeInfo.padding;
    } else {
      paddingLeft = paddingRight = paddingTop =
        paddingBottom = 0;
    }
    paddingLeft += nodeInfo.paddingLeft || 0;
    paddingRight += nodeInfo.paddingRight || 0;
    paddingTop += nodeInfo.paddingTop || 0;
    paddingBottom += nodeInfo.paddingBottom || 0;

    if (paddingLeft === 0 && paddingRight === 0 &&
          paddingTop === 0 && paddingBottom === 0) {
      return node;
    }

    child = node.append('g');
    child.attr({
      'gl-padding': nodeInfo.padding,
      'gl-padding-left': nodeInfo.paddingLeft,
      'gl-padding-right': nodeInfo.paddingRight,
      'gl-padding-top': nodeInfo.paddingTop,
      'gl-padding-bottom': nodeInfo.paddingBottom
    });
    percentWidth = percent(node.width());
    percentHeight = percent(node.height());
    child.size(
      percent(node.width(), 100 - (paddingLeft + paddingRight)),
      percent(node.height(), 100 - (paddingTop + paddingBottom)));
    child.position('top-left',
      percentWidth * paddingLeft, percentHeight * paddingTop);
    return child;
  }

  /**
   * Sizes the node based on the border parameters
   * @param  {d3 selection} node
   * @param  {Object} borderParams
   * {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   * @return {d3 selection}
   */
  function resizeBorderedContainer(node, borderParams) {
    var child;

    if (!borderParams.hasBorder) {
      return node;
    }

    child = node.append('g');
    child.size(
      node.width() - (borderParams.width[1] + borderParams.width[3]),
      node.height() - (borderParams.width[0] + borderParams.width[2]));
    child.position('top-left',
      borderParams.width[3], borderParams.width[0]);
    child.attr({
      'gl-bordered': 'true'
    });
    return child;
  }

  /**
   * Computes border parameters required to set borders
   * @param  {Object} nodeInfo
   * @return {Object} borderParams
   * borderParams = {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   */
  function getBorderParams(nodeInfo) {
    var borderParams = {},
      strokeWidth,
      width,
      hasBorder;

    width = [0, 0, 0, 0];
    hasBorder = false;

    if (nodeInfo.border) {
      strokeWidth = parseInt(nodeInfo.border, 10);
      width = [strokeWidth, strokeWidth, strokeWidth, strokeWidth];
      hasBorder = true;
    }
    if (nodeInfo.borderTop) {
      width[0] = parseInt(nodeInfo.borderTop, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderRight) {
      width[1] = parseInt(nodeInfo.borderRight, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderBottom) {
      width[2] = parseInt(nodeInfo.borderBottom, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderLeft) {
      width[3] = parseInt(nodeInfo.borderLeft, 10);
      hasBorder = true;
    }

    borderParams = {
      color: nodeInfo.borderColor || '#999',
      style: nodeInfo.borderStyle || 'solid',
      width: width,
      hasBorder: hasBorder
    };

    return borderParams;

  }

  function applyLayout(node) {
    if (node.attr('gl-container-name') === 'gl-vgroup') {
      node.layout({type: 'vertical'});
    } else if (node.attr('gl-container-name') === 'gl-hgroup') {
      node.layout({type: 'horizontal'});
    }
  }

  return {

    /**
     * Renders the layout, which is either specified by its string id,
     * or the layout object.
     * Takes the root svg element, width and height.
     */
    setLayout: function(layout, root, width, height) {
      var layoutConfig, node, dim, borderParams;

      layoutConfig = (typeof layout === 'string') ?
        layouts.getLayout(layout) :
        layout;

      array.getArray(layoutConfig).forEach(function(nodeInfo) {
        node = root.append('g');

        node.size(width, height);
        if (nodeInfo.backgroundColor) {
          node.backgroundColor(nodeInfo.backgroundColor);
        }
        if (nodeInfo.clip === true) {
          node.clip();
        }
        borderParams = getBorderParams(nodeInfo);
        if (borderParams.hasBorder) {
          node.border(
            borderParams.style,
            borderParams.color,
            borderParams.width
          );
          node = resizeBorderedContainer(node, borderParams);

        }
        node = getPaddingContainer(node, nodeInfo);

        node.attr({
          'gl-container-name': nodeInfo.name,
          'gl-split': nodeInfo.split
        });
        if (nodeInfo.class) {
          node.classed(nodeInfo.class, true);
        }
        if (node.attr('gl-container-name') === 'gl-vgroup') {
          dim = calculateDim(nodeInfo.split, height);
          dim = dim.map(function(d) {
            return [width, d];
          });
        } else if (node.attr('gl-container-name') === 'gl-hgroup') {
          dim = calculateDim(nodeInfo.split, width);
          dim = dim.map(function(d) {
            return [d, height];
          });
        }
        array.getArray(nodeInfo.children).forEach(function(child, i) {
          if (dim) {
            this.setLayout(child, node, dim[i][0], dim[i][1]);
          } else {
            this.setLayout(child, node, node.width(), node.height());
          }
        }, this);
        applyLayout(node);
      }, this);

    }

  };
});
