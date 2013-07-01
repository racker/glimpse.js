define(function () {
  'use strict';

  function getZIndex(ele) {
    return d3.select(ele).attr('gl-zIndex') || 0;
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
        parent.selectAll('.gl-component').remove()[0].sort(function(a, b) {
          return getZIndex(a) - getZIndex(b);
        }).forEach(function(ele) {
          parent.node().appendChild(ele);
        });
      }
      return this;
    }

  };

});
