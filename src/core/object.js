define([
  'core/array'
],
function (array) {
  'use strict';

  var Obj;
  Obj = {

    /**
     * Similar to underscore.js's extend() but es5 safe.
     */
    extend: function (target) {
      var sources = array.convertArgs(arguments, 1);
      sources.forEach(function (src) {
        if (typeof src !== 'object') {
          return;
        }
        Object.getOwnPropertyNames(src).forEach(function (propName) {
          Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(src, propName));
        });
      });
      return target;
    },

    isDef: function(val) {
      return val !== undefined;
    },

    isDefAndNotNull: function(val) {
      return val != null;
    },

    get: function(obj, path) {
      array.getArray(path).every(function(p) {
        obj = obj[p];
        return this.isDefAndNotNull(obj);
      }, this);
      if (obj) {
        return obj;
      }
      return null;
    },

    /**
     * Overrides a method on an object. Passes a reference to the original
     *  "super" method as the first argument to the new method. The "super"
     *  will be bound to the original o object.
     *
     * @param {Object} o The object.
     * @param {String} methodName The name of the method to override.
     * @param {function} newFn The new function to replace it with.
     */
    override: function(o, methodName, newFn) {
      var supr;

      // supr method is the original method.
      supr = o[methodName].bind(o);
      // Replace the original method with the new one.
      o[methodName] = function() {
        var args = array.convertArgs(arguments, 0);
        // Pass reference to super method as 1st arg.
        args.unshift(supr);
        return newFn.apply(o, args);
      };
    }

  };

  return Obj;
});
