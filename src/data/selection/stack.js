/**
 * @fileOverview
 * Stack data sources.
 */
define([
  'core/object',
  'data/selection/selection'
], function (obj, selection) {
  'use strict';

  var selectionPrototype = selection.getSelectionPrototype();

  /**
   * Applies a stacking function to the selected data sources.
   * Assumes presence of 'y' dimension, and adds a new 'y0' dimension.
   */
  selectionPrototype.stack = function() {
    var stack, flattenedSource;

    stack = d3.layout.stack()
      .values(function(d) {
        return d.data;
      });

    flattenedSource = this.flatten(['x','y']);

    stack(flattenedSource.all());
    flattenedSource.map(function(source) {
      source.id += '-stack';
      // Dimensions are not needed for flat fields.
      // Required because a component is checking for y0 dim.
      source.dimensions = {
        y0: 'y0'
      };
    });

    return flattenedSource;
  };

});
