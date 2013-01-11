define(
function () {
  'use strict';

  var Obj = {
    propertyDefaults: {
      writable: true,
      enumerable: true,
      configurable: true
    },
    create: function (parent) {
      var newObj = Object.create(parent || null);
      if (typeof newObj.init === 'function') {
        newObj.init();
      }
      return newObj;
    },
    defineProperty: function (obj, name, value) {
      var config = this.propertyDefaults;
      config.value = value;
      Object.defineProperty(obj, name, config);
    }
    //mixin: function () {}
  };

  return Obj;
});
