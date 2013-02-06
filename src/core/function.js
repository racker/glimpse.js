define([
  'core/array'
],
function (array) {
  'use strict';

  return {
    partial: function (fn) {
      var args = array.convertArgs(arguments, 1);
      return function() {
        var newArgs = array.convertArgs(arguments);
        newArgs.unshift.apply(newArgs, args);
        return fn.apply(this, newArgs);
      };
    }
  };

});
