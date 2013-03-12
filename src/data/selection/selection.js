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

  Selection.prototype.map = function(fn) {
    return new Selection(this.dataSources_.map(fn));
  };

  Selection.prototype.dimMap = function(fn) {
    return dimension.create(this.dataSources_.map(fn));
  };

  Selection.prototype.all = function() {
    return this.dataSources_;
  };

  Selection.prototype.get = function(i) {
    i = i || 0;
    return this.dataSources_[i];
  };

  Selection.prototype.dim = function(dim) {
    return this.dimMap(function(dataSource) {
      return dataSource.data.map(dataFns.dimension(dataSource, dim));
    });
  };

  return {

    create: function(optDataSource) {
      return new Selection(optDataSource);
    },
    getSelectionPrototype: function() {
      return Selection.prototype;
    }

  };

});
