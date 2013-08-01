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
    },

    compose: function() {
      var funcs = arguments;
      return function() {
        var args = arguments,
            i;
        for (i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
      };
    }

  };

});
