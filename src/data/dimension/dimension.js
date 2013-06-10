/**
 * @fileOverview
 * Data Dimension.
 */
define([
  'core/array'
], function (array) {
  'use strict';

  var Dimension;

  function sumReduce(arr) {
    return arr.reduce(function(prevValue, curValue){
      return curValue + prevValue;
    });
  }

  /**
   * @constructor
   * Data Dimension.
   * @param {(Object, Array.<Object>)?} optDataSource
   */
  Dimension = function(optDataSource) {
    this.dataSources_ = array.getArray(optDataSource);
  };

  /**
   * Adds a dimension to the dimension selection.
   */
  Dimension.prototype.add = function(data) {
    if(Array.isArray(data)) {
      array.append(this.dataSources_, data);
    } else {
      this.dataSources_.push(data);
    }
    return this;
  };

  /**
   * Generic map function that accepts and applies a function
   *   on its sources.
   */
  Dimension.prototype.map = function(fn, context) {
    return new Dimension(this.dataSources_.map(fn, context));
  };

  /**
   * Accepts and applies a filter fn on its dimension sources.
   */
  Dimension.prototype.filter = function(fn, context) {
    return this.map(function(dataSource) {
      return dataSource.filter(fn, context);
    });
  };

  /**
   * Sums all the values and returns the selection.
   */
  Dimension.prototype.sum = function() {
    return this.map(function(dataSource) {
      return sumReduce(dataSource);
    });
  };

  /**
   * Averages the values in the dimension selection.
   */
  Dimension.prototype.avg = function() {
    return this.map(function(dataSource) {
      return sumReduce(dataSource)/dataSource.length;
    });
  };

  /**
   * Computes the max values in the dimension selection.
   */
  Dimension.prototype.max = function() {
    return this.map(function(dataSource) {
      return d3.max(dataSource);
    });
  };

  /**
   * Computes the min values in the dimension selection.
   */
  Dimension.prototype.min = function() {
    return this.map(function(dataSource) {
      return d3.min(dataSource);
    });
  };

  /**
   * Computes the max/min values in the dimension selection.
   */
  Dimension.prototype.extent = function() {
    return this.map(function(dataSource) {
      return d3.extent(dataSource);
    });
  };

  /**
   * Rounds the values in the dimension selection.
   */
  Dimension.prototype.round = function() {
    return this.map(function(dataSource) {
      if (Array.isArray(dataSource)) {
        return dataSource.map(function(d) {
          return Math.round(d);
        });
      } else {
        return Math.round(dataSource);
      }
    });
  };

  /**
   * Concatinates the values in multiple sources into one.
   */
  Dimension.prototype.concat = function() {
    var arr = [];
    this.dataSources_.forEach(function(dataSource) {
      arr = arr.concat(dataSource);
    });
    return new Dimension([arr]);
  };

  /**
   * Returns the raw value of the selection.
   */
  Dimension.prototype.all = function() {
    return this.dataSources_;
  };

  /**
   * Returns a source by index.
   * Defaults to returning the first source.
   * @param {number?} i index of the data source
   */
  Dimension.prototype.get = function(i) {
    i = i || 0;
    return this.dataSources_[i];
  };

  return {

    /**
     * Creates a new dimension selection.
     * Optionally takes in a single or list of dimension arrays
     * to initialize the selection.
     */
    create: function(optDimensions) {
      return new Dimension(optDimensions);
    },

    /**
     * Returns dim selection prototype for extension.
     */
    getDimensionPrototype: function() {
      return Dimension.prototype;
    }

  };

});
