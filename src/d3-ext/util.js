/**
 * @fileOverview
 * Utility functions related to d3 selections.
 */
define(
function() {
  'use strict';

  return {

    /**
     * Same as d3.select but allows a d3.selection as input too.
     * @param {d3.selection|string} selection
     */
    select: function(selection) {
      return (Array.isArray(selection)) ?
        selection :
        d3.select(selection);
    }

  };

});
