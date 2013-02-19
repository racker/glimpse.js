// Array utility functions

define(
function () {
  'use strict';

  var array;

  array = {

    /**
     * Finds the first occurance of an item in an array.
     */
    find: function (ary, fn) {
      var i, len = ary.length;
      for (i = 0; i < len; i += 1) {
        if (fn(ary[i])) {
          return ary[i];
        }
      }
    },

    /**
     * Search an array for the first element that satisfies
     *   a given condition and return its index.
     * @param {Array} arr The array to search.
     * @param {Function} f The function to call for every element. This function
     *     takes 3 arguments (the element, the index and the array) and should
     *     return a boolean.
     * @param {Object} optObj An optional "this" context for the function.
     * @return {number} The index of the first array element
     *    that passes the test, or -1 if no element is found.
     */
    findIndex: function (arr, fn, optObj) {
      var len, arr2, i;

      len = arr.length;  // must be fixed during loop... see docs
      arr2 = typeof arr === 'string' ? arr.split('') : arr;
      for (i = 0; i < len; i += 1) {
        if (i in arr2 && fn.call(optObj, arr2[i], i, arr)) {
          return i;
        }
      }
      return -1;
    },

    /**
     * Convert 'arguments' object into a real array,
     * starting at optional 'from' index.
     */
    convertArgs: function (args, from) {
      return Array.prototype.slice.call(args, from || 0);
    },

    /**
     * Appends array provided array
     * @param  {Array} arr
     * @param  {Array} arrToAppend
     */
    append: function (arr, arrToAppend) {
      Array.prototype.splice.apply(arr, [arr.length, 0].concat(arrToAppend));
      return arr;
    },

    /*
     * Converts input to an array object, if it isn't.
     * Returns empty array if input is null or undefined.
     */
    getArray: function (obj) {
      return obj ? (Array.isArray(obj) ? obj: [obj]) : [];
    },

    /**
     * Removes items from an array by mutating it.
     * @param {Array} arr The array to remove from.
     * @param {Object|Array} items The item or array of items to remove.
     * @return {Array} The items actually removed.
     */
    remove: function(arr, items) {
      var removedItems = [];
      array.getArray(items).forEach(function(item) {
        var index = arr.indexOf(item);
        if (index !== -1) {
          arr.splice(index, 1);
          removedItems.push(item);
        }
      });
      return removedItems;
    }

  };

  return array;

});
