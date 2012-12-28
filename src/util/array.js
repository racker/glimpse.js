// Array utility functions


define(
function () {
  'use strict';

  var arrayProto = {
    find: function (ary, fn) {
      var i, len = ary.length;
      for (i = 0; i < len; i += 1) {
        if (fn(ary[i])) {
          return ary[i];
        }
      }
    }
  };

  return arrayProto;
});
