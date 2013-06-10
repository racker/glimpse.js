/**
 * @fileOverview
 * Data Selection.
 */
define([
  'data/dimension/dimension',
  'core/object',
  'core/array',
  'data/functions'
], function (dimension, obj, array, dataFns) {
  'use strict';

  var Selection;

  /**
   * @constructor
   * Data Selection.
   */
  Selection = function(optDataSource) {
    this.dataSources_ = array.getArray(optDataSource);
  };

  /**
   * Adds a new data sources to an existing selection.
   * @param {Object|Array.<Object>} data
   */
  Selection.prototype.add = function(data) {
    if(Array.isArray(data)) {
      array.append(this.dataSources_, data);
    } else {
      this.dataSources_.push(data);
    }
    return this;
  };

  /**
   * Applies filter using dimensions on data sources.
   * This will eventually be a more versatile function.
   * Assumes when two inputs are given, that the first is a dimension and
   * second is a range if it is an array.
   * TODO: If second arg is simple value, filter if equal to that value.
   *       If second arg is a function, use that function.
   */
  Selection.prototype.filter = function(dim, range) {
    return this.map(function(dataSource) {
      var filteredDataSource = {}, accessor;
      obj.extend(filteredDataSource, dataSource);
      accessor = dataFns.dimension(dataSource, dim);
      filteredDataSource.data =  filteredDataSource.data.filter(
        function(d) {
          var e = accessor(d);
          return e >= range[0] && e<= range[1];
        }
      );
      return filteredDataSource;
    });
  };

  /**
   * Filters the datasources by tags.
   * returns datasources which do not contain tags.
   * @param  {array|string} tags
   */
  Selection.prototype.filterByTags = function (tags) {
    return new Selection(this.dataSources_.filter(
      function(dataSource) {
        return array.getArray(tags).every(function(tag) {
          return !array.contains(dataSource.tags, tag);
        });
      })
    );
  };

  /**
   * Returns the number of data sources in the selection.
   */
  Selection.prototype.length = function() {
    return this.dataSources_.length;
  };

  /**
   * Helper method to run map on a selection.
   */
  Selection.prototype.map = function(fn) {
    return new Selection(this.dataSources_.map(fn));
  };

  /**
   * Helper function to return dimension selection over
   * a map of the selection.
   */
  Selection.prototype.dimMap = function(fn) {
    return dimension.create(this.dataSources_.map(fn));
  };

  /**
   * Returns all the data sources.
   */
  Selection.prototype.all = function() {
    return this.dataSources_;
  };

  /**
   * Returns the raw data source specified by index.
   * Returns the first data source if no index is specified.
   * @param {number?} i index of the data source
   */
  Selection.prototype.get = function(i) {
    i = i || 0;
    return this.dataSources_[i];
  };

  /**
   * Returns a dimension selection of the specified dimension.
   * @param {string} dim The dimension
   */
  Selection.prototype.dim = function(dim) {
    return this.dimMap(function(dataSource) {
      return dataSource.data.map(dataFns.dimension(dataSource, dim));
    });
  };

  /**
   * Returns a new selection with the specified dimensions
   * in a flat form.
   * @param {string|Array.<string>} dims A list of dimensions.
   */
  Selection.prototype.flatten = function(dims) {
    return this.map(function(dataSource) {
      var newDataSource = {};
      obj.extend(newDataSource, dataSource);
      delete newDataSource.dimensions;
      newDataSource.data = dataSource.data.map(function(d) {
        var data = {};
        array.getArray(dims).forEach(function(dim) {
          data[dim] = dataFns.dimension(dataSource, dim)(d);
        });
        return data;
      });
      return newDataSource;
    });
  };

  return {

    /**
     * Creates a new selection.
     * Optionally takes in a single or list of data sources
     * to initialize the selection.
     * @param {(Object, Array.<Object>)?}
     */
    create: function(optDataSource) {
      return new Selection(optDataSource);
    },

    /**
     * Returns selection prototype for extension.
     */
    getSelectionPrototype: function() {
      return Selection.prototype;
    }

  };

});
