define(function () {
  'use strict';

  function getZIndex(ele) {
    return d3.select(ele).attr('gl-zIndex') || 0;
  }

  /**
   * Filters a nodeList by className and returns
   * a d3 selection.
   */
  function filterByClass(nodeList, className) {
    var matches = [], i;
    for (i = 0; i < nodeList.length; i++) {
      if(d3.select(nodeList[i]).classed(className)) {
        matches.push(nodeList[i]);
      }
    }
    return d3.selectAll(matches);
  }

  return {

    /**
     * Enforces z-index based positioning of a component within its
     * parent container.
     */
    applyZIndex: function () {
      var root = this.root(), parent;
      if (root) {
        root.attr('gl-zIndex', this.zIndex());
        parent = d3.select(root.node().parentNode);
        filterByClass(parent.node().childNodes, 'gl-component')
          .remove()[0].sort(function(a, b) {
            return getZIndex(a) - getZIndex(b);
          }).forEach(function(ele) {
            parent.node().appendChild(ele);
          });
      }
      return this;
    }

  };

});
