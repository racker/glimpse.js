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
    },

    /**
     * Applies a function to a component target conditionally if it exists.
     *
     * @param {components.component} component
     * @param {d3.selection|string|null} selection
     * @param {Function} fn The function to apply if the target exists.
     *   This function will be passed the target as a single arg,
     *   and executed in the context of the component.
     * @return {null|*} Returns null if target is empty,
     *   otherwise whatever fn returns.
     */
    applyTarget: function(component, selection, fn) {
      var target;

      target = this.select(selection || component.config('target'));
      if (!target || target.empty()) {
        return null;
      }
      return fn.call(component, target);
    }

  };

});
