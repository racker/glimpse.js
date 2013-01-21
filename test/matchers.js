beforeEach(function() {
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

    toHaveAttr: function (attrName, attrValue) {
      if (attrValue) {
        return this.actual.getAttribute(attrName) === attrValue.toString();
      }
      return this.actual.hasAttribute(attrName);
    },

    toBeDefinedAndNotNull: function () {
      var actual = this.actual;

      this.message = function () {
        return 'Expected ' + actual + ' to be defined and not null';
      }

      return actual != null;
    }

  });
});
