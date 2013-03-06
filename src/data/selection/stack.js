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
    var mutatedData, stack, layers;

    stack = d3.layout.stack()
      .values(function(d) {
        return d.data;
      });

    layers = this.map(function(source) {
      var newSource = {};
      // make copy of each data source.
      obj.extend(newSource, source);
      // data points to get by accessor methods to change later
      mutatedData = [];
      newSource.data.forEach(function(d) {
        mutatedData.push({
          x: source.x(d),
          y: source.y(d)
        });
      });
      newSource.id += '-stack';
      newSource.data = mutatedData;
      // Recreate accessors as simplpe getters
      newSource.x = function(d) { return d.x; };
      newSource.y = function(d) { return d.y; };
      newSource.y0 = function(d) { return d.y0; };
      return newSource;
    });

    // Apply d3 stacking function to new copy of the data.
    stack(layers.all());
    return layers;
  };

});
