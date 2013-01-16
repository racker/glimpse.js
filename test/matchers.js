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

    toHaveProperties: function (name0, name1, name2) {
      var actual = this.actual,
        len = arguments.length,
        i;
      for (i = 0; i < len; i += 1) {
        if (actual[arguments[i]] === undefined) {
          return false;
        }
      }
      return true;
    }

  });
});
