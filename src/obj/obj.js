define(
function () {
  'use strict';

  var propertyDescriptorDefaults, BaseProto, ObjectHelper;

  // convert "arguments" object into a real array
  function convertArgs(args, from) {
    return Array.prototype.slice.call(args, from || 0);
  }

  ObjectHelper = Object.freeze(
    Object.create(Object.prototype, {

      // get a completely empty object with no prototype
      empty: {
        value: function (props) {
          var obj = Object.create(null);
          if (props) {
            this.propCopy(obj, props);
          }
          return obj;
        }
      },

      // similar to _.extend() but es5 safe
      propCopy: {
        value: function (target) {
          var sources = convertArgs(arguments, 1);
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
      },

      // convenience pass-thru to extend the base proto object
      extend: {
        value: function () {
          return BaseProto.extend.apply(BaseProto, arguments);
        }
      }

    })
  );

  // default property descriptor
  // TODO: make these defaults configurable somehow
  propertyDescriptorDefaults = ObjectHelper.empty({
    writable: true,
    configurable: false,
    enumerable: true
  });

  // convenience to use the default property descriptors and optionally override
  // TODO: maybe add logic for getters/setters???
  function propertyDefaults(props) {
    return ObjectHelper.propCopy(
        Object.create(null), propertyDescriptorDefaults, props);
  }


  // All objects inherit from BaseProto to get enhanced functionality
  BaseProto = Object.freeze(
    Object.create(Object.prototype, {

      // direct access to prototype
      proto: {
        get: function () {
          return Object.getPrototypeOf(this);
        },
        enumerable: true
      },

      // extends the current object by making it the prototype of a new object
      // optionally apply properties to the new object inline
      extend: propertyDefaults({
        value: function (props) {
          var propsObject, newObj, args;
          args = convertArgs(arguments);
          newObj = Object.create(this);
          if (args.length) {
            args.unshift(newObj);
            ObjectHelper.propCopy.apply(undefined, args);
          }
          return Object.freeze(newObj);
        }
      }),

      'new': {
        value: function create() {
          var obj = Object.create(this);
          if (obj.init) {
            obj.init.apply(obj, arguments);
          }
          return obj;
        }
      },

      // placeholder, should be overridden
      init: propertyDefaults({
        value: function () {
          // noop. override me!
        }
      }),

      // copy all properties from other objects to this one
      mixin: propertyDefaults({
        value: function () {
          var args = convertArgs(arguments);
          args.unshift(this);
          ObjectHelper.propCopy.apply(ObjectHelper, args);
        }
      }),

      // get/set internal configuration options
      config: propertyDefaults({
        value: function () {
          var args = convertArgs(arguments),
              firstArg;

          if (args.length === 0) {
            return undefined;
          }
          firstArg = args[0];
          if (args.length === 1) {
            if (typeof firstArg === 'string') {
              return this[firstArg];
            }
            if (typeof firstArg === 'object') {
              ObjectHelper.propCopy(this, firstArg);
            }
          }
          if (args.length === 2) {
            this[firstArg] = args[1];
          }
          return this;

        }
      })

    })
  );

  return ObjectHelper;
});
