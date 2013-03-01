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
    },

    getMockComponent: function(mockId) {
      return {

        target: null,

        render: function(selection) {
          var parent = selection || this.target;
          parent.append('g').attr('mock-id', mockId);
        },

        root: function() {
          return null;
        },

        destroy: function() {}
      };
    }
  };

});
