define([
  'core/object',
  'core/array'
],
function (obj, array) {
  'use strict';

  return function (context, configObj, propNames) {

    var mixin = {};

    // generate all the individual property config functions
    propNames.forEach(function (propName) {
      mixin[propName] = function (value) {
        if (!arguments.length) {
          return configObj[propName];
        }
        configObj[propName] = value;
        return context;
      };
    });

    // the main multi-property config function
    mixin.config = function () {
      var args = array.convertArgs(arguments),
          firstArg;

      if (args.length === 0) {
        return undefined;
      }
      firstArg = args[0];
      if (args.length === 1) {
        if (typeof firstArg === 'string') {
          return configObj[firstArg];
        }
        if (typeof firstArg === 'object') {
          obj.extend(configObj, firstArg);
        }
      } else if (args.length === 2) {
        configObj[firstArg] = args[1];
      }
      return context;
    };

    return mixin;
  };
});
