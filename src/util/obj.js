define([
  'util/array'
],
function (array) {
  'use strict';

  var Obj;

  Obj = {

    // get a completely empty object with no prototype
    empty: function (props) {
      var obj = Object.create(null);
      if (props) {
        Obj.extend(obj, props);
      }
      return obj;
    },

    // similar to _.extend() but es5 safe
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
    }

  };

  return Obj;
});
