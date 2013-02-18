/**
 * @fileOverview
 * These are methods that all components are expected to have.
 * Use this mixin as a convenience for noops and override as needed.
 */
define(function () {
  'use strict';

  return {

    render: function() {
      // noop
      return this;
    },

    update: function() {
      // noop
      return this;
    },

    destroy: function() {
      // noop
      return this;
    }

  };

});
