/**
 * @fileOverview
 * Helper functions for component related tests.
 */
define(
function() {
  'use strict';

  return {
    getByCid: function(cid) {
      return d3.select('[gl-cid=' + cid + ']');
    }
  };

});
