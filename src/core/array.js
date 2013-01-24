// Array utility functions

define(
function () {
  'use strict';

  return {

    /**
     * Finds the first occurance of an item in an array.
     */
    find: function (ary, fn) {
      var i, len = ary.length;
      for (i = 0; i < len; i += 1) {
        if (fn(ary[i])) {
          return ary[i];
        }
      }
    },

    /**
     * Convert 'arguments' object into a real array,
     * starting at optional 'from' index.
     */
    convertArgs: function (args, from) {
      return Array.prototype.slice.call(args, from || 0);
    }

  };

});
