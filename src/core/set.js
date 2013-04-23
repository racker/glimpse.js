/**
 * @fileOverview
 * Very simple implementation for an unordered set.
 * Works with primitive types such as strings and numbers.
 */
define([
  'core/object',
  'core/array'
],
function (obj, array) {
  'use strict';

  function set() {
    var store = {};

    return {

      /**
       * Adds element(s) to the set.
       */
      add: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          store[element] = true;
        });
      },

      /**
       * Removes element(s) to the set.
       */
      remove: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          delete store[element];
        });
      },

      /**
       * Serializes the set to an array.
       * Note: order is not preserved.
       */
      toArray: function() {
        return Object.keys(store);
      },

      /**
       * Returns true if set is empty.
       */
      isEmpty: function() {
        return Object.keys(store).length === 0;
      },

      /**
       * Returns true if set contains all the elements specified.
       *         false otherwise.
       */
      contains: function(elements) {
        elements = array.getArray(elements);
        return elements.every(function(element) {
          return obj.isDef(store[element]);
        });
      },

      /**
       * Toggles the presence of the element(s).
       * If element is present, it is removed.
       * If element is absent, it is added.
       */
      toggle: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          if (this.contains(element)) {
            this.remove(element);
          } else {
            this.add(element);
          }
        }, this);
      }

    };
  }

  return {

    /**
     * Creates a new set.
     * Takes in optional elements to initialize the set.
     */
    create: function (elements) {
      var newSet = set();
      if (obj.isDef(array)) {
        newSet.add(elements);
      }
      return newSet;
    }

  };

});
