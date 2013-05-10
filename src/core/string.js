/**
 * @fileOverview
 * String utility functions.
 */
define(
function () {
  'use strict';

  return {

    /**
     * Generates a random string.
     */
    random: function () {
      // 2^31
      var x = 2147483648;
      return Math.floor(Math.random() * x).toString(36) +
        Math.abs(Math.floor(Math.random() * x) ^ (new Date()).getTime())
        .toString(36);
    },

    /**
     * Convenience function to create multiple class strings.
     */
    classes: function () {
      var r = Array.prototype.join.call(arguments, ' gl-');
      return r ? 'gl-' + r : '';
    },

    /**
     * Convenience function to string.
     */
    isString: function (item) {
      return typeof item === 'string';
    },

    /**
     * Determins if a string starts with a prefix or not.
     *
     * @param {String} str The string to check.
     * @param {String} prefix The prefix to search for.
     * @return {Boolean}
     */
    startsWith: function(str, prefix) {
      return typeof str === 'string' &&
        typeof prefix === 'string' &&
        str.slice(0, prefix.length) === prefix;
    }

  };

});
