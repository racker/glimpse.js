beforeEach(function() {
  /*jshint validthis: true */
  'use strict';

  function isObject(val) {
    var type = typeof val;
    return (type === 'object' && val !== null) || type === 'function';
  }

  function toHaveAttr (attrName, attrValue) {
    var actualAttrValue, msg;
    actualAttrValue = this.actual.getAttribute(attrName);
    msg = jasmine.pp(attrName) + ' and value ' +
          jasmine.pp(actualAttrValue) + ' instead of ' + jasmine.pp(attrValue);
    this.message = function () {
      return [
        'Expected node to have attribute name ' + msg,
        'Expected node to not have attribute name ' + msg
      ];
    };
    return actualAttrValue === attrValue.toString();
  }

  this.addMatchers({

    toBeArray: function() {
      return {}.toString.call(this.actual) === '[object Array]';
    },

    toBeNumber: function() {
      return typeof this.actual === 'number';
    },

    toBeOfType: function(type) {
      return typeof this.actual === type;
    },

    toHaveProperties: function() {
      var actual = this.actual,
        len = arguments.length,
        i;
      this.message = function () {
        return [
          'Expected ' + jasmine.pp(arguments) + ' to be subset of ' +
              jasmine.pp(this.actual.classList),
          'Expected ' + jasmine.pp(arguments) + ' not to be a subset of ' +
              jasmine.pp(this.actual.classList)
        ];
      };
      for (i = 0; i < len; i += 1) {
        if (actual[arguments[i]] === undefined) {
          return false;
        }
      }
      return true;
    },

    toHaveClasses: function() {
      var actual = this.actual,
        len = arguments.length,
        classes = Array.prototype.slice.call(actual.classList),
        i;
      for (i = 0; i < len; i += 1) {
        if (classes.indexOf(arguments[i]) === -1) {
          return false;
        }
      }
      return true;
    },

    toHaveAttr: function () {
      var k = arguments[0], key;
      if (arguments.length === 2) {
        return toHaveAttr.call(this, k,  arguments[1]);
      }
      if (isObject(k)) {
        for (key in k) {
          if (!toHaveAttr.call(this, key, k[key])) {
            return false;
          }
        }
      } else {
        return this.actual.hasAttribute(k);
      }
      return true;
    },

    toBeDefinedAndNotNull: function () {
      var actual = this.actual;

      this.message = function () {
        return 'Expected ' + actual + ' to be defined and not null';
      };

      return actual !== null;
    }

  });
});
