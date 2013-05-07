/**
 * @fileOverview
 * d3 Selection clip path helper.
 */
define([
  'd3',
  'core/string'
],
function(d3, string) {
  'use strict';

  /**
   * d3 selection clip
   *
   * Adds a clipPath for the <g> element in the selection.
   */
  d3.selection.prototype.clip = function() {
    var layoutRect, defs, clipPath, clipRect;

    if (this.node().tagName !== 'g') {
      return this;
    }

    layoutRect = this.select('.gl-layout');
    if (layoutRect.empty()) {
      this.size(this.width(), this.height());
      layoutRect = this.select('.gl-layout');
    }

    defs = this.select('defs');
    if (defs.empty()) {
      defs = this.append('defs');
    }

    clipPath = defs.select('clipPath');
    if (clipPath.empty()) {
      clipPath = defs.append('clipPath')
        .attr({
          'class': 'gl-clip-path',
          id: 'gl-clip-path-' + string.random()
        });
    }

    clipRect = clipPath.select('rect');
    if (clipRect.empty()) {
      clipRect = clipPath.append('rect');
    }
    clipRect.attr({
      width: this.width(),
      height: this.height()
    });

    this.attr({
      'gl-clip': 'true',
      'clip-path': 'url(#' + clipPath.attr('id') + ')'
    });
    return this;
  };

  return d3;
});
