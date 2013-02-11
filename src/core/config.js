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

  var mixinGenerator;

  /**
   * Generates a config() mixin that gets/sets properties on the specified
   * configObj. Use with core.object.extend();
   * @param {Object} configObj Where to get/set properties.
   * @param {String} propNames... Optional series of property names to add
   *  convenience functions for.
   * @return {Object}
   */
  mixinGenerator = function(configObj) {

    var mixin = {},
        propNames = array.convertArgs(arguments, 1);

    function setValue(key, value) {
      configObj[key] = value;
    }

    function getValue(key) {
      return configObj[key];
    }

    // Generate all the individual property config functions.
    propNames.forEach(function (propName) {
      mixin[propName] = function (value) {
        if (!arguments.length) {
          return getValue(propName);
        }
        setValue(propName, value);
        return this;
      };
    }, this);

    /**
     * Adds specified methods to current context and rebinds them to src.
     * Similar to d3.rebind(), but also saves any set values in context obj
     * via config() mixin too.
     * @see https://github.com/mbostock/d3/wiki/Internals#wiki-rebind
     * @param {Object} src
     * @param {String} methods...
     */
    mixin.rebind = function(src) {
      var methods = array.convertArgs(arguments, 1);

      if (!this.__boundMethods__) {
        this.__boundMethods__ = [];
      }
      methods.forEach(function(method) {
        this.__boundMethods__.push(method);
        this[method] = function() {
          // Call setter on the bound object
          if (arguments.length) {
            src[method].apply(this, arguments);
          }
          if (arguments.length > 1) {
            // Set array on config if more than 1 arg.
            setValue.call(null, method, array.convertArgs(arguments));
          } else if (arguments.length === 1) {
            // Set the single value.
            setValue(method, arguments[0]);
          } else if (arguments.length === 0) {
            // No values to set, just return corresponding value.
            return getValue(method);
            //return src[method].call(this);
          }
          return this;
        };
      }, this);
    };

    /**
     * Calls all the bound methods for the target object using the target's
     * config. Assumes the config.mixin() is applied.
     * @param {String[]} filters Optionally apply on a subset of the
     *  bound methods.
     */
    mixin.reapply = function(filters) {
      var methods, value;
      if (!this.__boundMethods__) {
        return;
      }
      methods = this.__boundMethods__;
      if (filters) {
        methods = methods.filter(function(method) {
          return filters.indexOf(method) !== -1;
        });
      }
      methods.forEach(function(method) {
        value = getValue(method);
        if (value !== undefined) {
          this[method](getValue(method));
        }
      }, this);
    };

    /**
     * @desc A multi-property config function.
     * All use-cases that don't specificially return a value will return the
     *   context object.
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
          firstArg,
          boundMethodFilter;

      if (argCount === 0) {
        // TODO: Might want to core.object.clone() this.
        return configObj;
      }
      firstArg = args[0];
      if (argCount === 1) {
        if (typeof firstArg === 'string') {
          return getValue(firstArg);
        }
        if (typeof firstArg === 'object') {
          obj.extend(configObj, firstArg);
          boundMethodFilter = Object.keys(firstArg);
        }
      } else {
        // 2 args.
        setValue(firstArg, args[1]);
        boundMethodFilter = [firstArg];
      }
      this.reapply(boundMethodFilter);
      return this;
    };

    return mixin;
  };

  return {
    mixin: mixinGenerator
  };

});
