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
    }

  };

});
