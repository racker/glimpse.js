/**
 * @fileOverview
 * Accessor generator.
 */
define([
  'core/object'
], function (obj) {
  'use strict';

  var cache = {};

  function getAccessor(dimVal) {
    var splitPath, accessorFn;
    dimVal = dimVal.trim();
    accessorFn = cache[dimVal];
    if (accessorFn) {
      return accessorFn;
    }
    splitPath = dimVal.split('.');
    accessorFn = function(d) {
      return obj.get(d, splitPath);
    };
    cache[dimVal] = accessorFn;
    return accessorFn;
  }

  return {

    /**
     * Returns input if function.
     * If input is string, it returns a cached accessor
     * else generates a new accessor for the string.
     */
    get: function(accessor) {
      if (typeof accessor === 'function') {
        return accessor;
      }
      if (typeof accessor === 'string') {
        return getAccessor(accessor);
      }
    },

    /**
     * Clears the accessors cache.
     */
    clear: function() {
      cache = {};
    }

  };

});
