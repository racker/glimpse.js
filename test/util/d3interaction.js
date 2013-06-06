/**
 * @fileOverview
 * Helper functions for d3 interaction.
 */
define(
function() {
  'use strict';

  return {

    click: function(ele) {
      ele.__onclick();
    }

  };

});
