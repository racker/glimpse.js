define(
function () {
  'use strict';

  var Obj = {
    propertyDefaults: {
      writable: true,
      enumerable: true,
      configurable: true
    },
    create: function (parent, props) {
      var newObj;

      newObj = Object.create(parent || null);
      if (props) {
        Object.getOwnPropertyNames(props).forEach(function (prop) {
          this.defineProperty(newObj, prop, props[prop]);
        }, this);
      }

      // TODO: usefulness is questionable
      //if (typeof newObj.init === 'function') {
        //newObj.init();
      //}
      return newObj;
    },
    defineProperty: function (obj, name, value) {
      var config = this.propertyDefaults;
      config.value = value;
      Object.defineProperty(obj, name, config);
    },
    hasPrototype: function (obj) {
      var proto = Object.getPrototypeOf(obj);
      return proto !== null && proto !== Object.prototype;
    }
    //mixin: function () {}
  };

  return Obj;
});
