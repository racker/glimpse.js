/**
 * @fileOverview
 * Data functions.
 */
define([
  'core/object',
  'data/accessors'
], function (obj, accessors) {
  'use strict';

  return {

    /**
     * Gets the data using the dimension accessor.
     */
    dimension: function(data, dim) {
      var dimValue;
      dimValue = obj.get(data, ['dimensions', dim]);
      if (!dimValue) {
        return null;
      }
      return accessors.get(dimValue);
    }

  };

});
