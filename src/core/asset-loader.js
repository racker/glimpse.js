/**
 * @fileOverview
 * Loads SVG assets and injects them into the page.
 */
define([
  'assets/assets'
],
function(assets) {
  'use strict';

  return {

    /**
     * Loads all precompiled SVG assets into the DOM.
     */
    loadAll: function() {
      // Only append if it doesn't already exist.
      if (!d3.select('#gl-global-assets').empty()) {
        return;
      }
      d3.select(document.body).append('div')
        .attr({
          id: 'gl-global-assets'
        })
        .style({
          'height': '0px',
          'width': '0px',
          'display': 'none'
        })
      .html(assets);
    },

    /**
     * Removes the element containing all precompiled SVG assets.
     */
    removeAll: function() {
      var body = document.body;
      body.removeChild(body.querySelector('#gl-global-assets'));
    }

  };

});
