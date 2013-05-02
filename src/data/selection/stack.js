/**
 * @fileOverview
 * Stack data sources.
 */
define([
  'core/object',
  'data/selection/selection',
  'data/functions'
], function (obj, selection, dataFns) {
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
      // Make copy of each data source.
      obj.extend(newSource, source);
      // Data points to get by accessor methods to change later.
      mutatedData = [];
      newSource.data.forEach(function(d, i) {
        var dataPointCopy = {};
        Object.keys(source.dimensions).forEach(function(dimKey) {
          dataPointCopy[dimKey] = dataFns.dimension(source, dimKey)(d, i);
        });
        mutatedData.push(dataPointCopy);
      });
      newSource.id += '-stack';
      newSource.dimensions.y0 = 'y0';
      newSource.data = mutatedData;
      return newSource;
    });

    // Apply d3 stacking function to new copy of the data.
    stack(layers.all());
    return layers;
  };

});
