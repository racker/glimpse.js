/**
 * @fileOverview
 * Config mixin generator.
 * A function to generate a new object with a config() method.
 * Optionally adds various named getter/setter methods for individual
 * config options.
 */
define([
  'core/object',
  'core/array'
],
function (obj, array) {
  'use strict';

  return function (context, configObj, propNames) {

    var mixin = {};

    // Generate all the individual property config functions.
    if (propNames && Array.isArray(propNames)) {
      propNames.forEach(function (propName) {
        mixin[propName] = function (value) {
          if (!arguments.length) {
            return configObj[propName];
          }
          configObj[propName] = value;
          return context;
        };
      });
    }

    /**
     * @desc A multi-property config function.
     * All uses that don't specificially return a value will return the context.
     *
     * Uses:
     *  - Call with single object to set multiple config options.
     *  - Call with string to get a single config option.
     *    NOTE: if value is a function it will be executed.
     *  - Call with string and value to set a single config option.
     *  - Call with 0 args to get the object containing all config options.
     *    NOTE: this is the live object and should not be mutated.
     */
    mixin.config = function () {
      var args = array.convertArgs(arguments),
          argCount = args.length,
          firstArg;

      if (argCount === 0) {
        // TODO: Might want to core.object.clone() this.
        return configObj;
      }
      firstArg = args[0];
      if (argCount === 1) {
        if (typeof firstArg === 'string') {
          return typeof configObj[firstArg] === 'function' ?
            configObj[firstArg](context) :
            configObj[firstArg];
        }
        if (typeof firstArg === 'object') {
          obj.extend(configObj, firstArg);
        }
      } else {
        // 2 args.
        configObj[firstArg] = args[1];
      }
      return context;
    };

    return mixin;
  };
});
