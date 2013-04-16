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

    root: function() {
      // noop
    },

    isRendered: function() {
      return !!this.root();
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
