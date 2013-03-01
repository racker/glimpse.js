/**
 * @fileOverview
 * Data Selection.
 */
define([
  'data/dimension/dimension',
  'core/array'
], function (dimension, array) {
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
      // TODO: Handle dimensions from dimensions field.
      return dataSource.data.map(dataSource[dim]);
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
