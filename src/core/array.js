// Array utility functions

define(
function () {
  'use strict';

  return {

    find: function (ary, fn) {
      var i, len = ary.length;
      for (i = 0; i < len; i += 1) {
        if (fn(ary[i])) {
          return ary[i];
        }
      }
    },

    // convert "arguments" object into a real array
    convertArgs: function (args, from) {
      return Array.prototype.slice.call(args, from || 0);
    }
  };

});
