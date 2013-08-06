define([
  'core/object',
  'core/config',
  'core/array',
  'mixins/dispatch',
  'mixins/toggle',
  'mixins/zIndex',
  'events/pubsub'
], function (obj, config, array, dispatch, toggle, zIndex, pubsub) {

  'use strict';

  return {

    /**
    * @description Returns the root selection of the component.
    * @return {d3.selection}
    */
    root: function () {
      return this._.root;
    },

    init: function() {
      var _ = this._;
      _.globalPubsub = pubsub.getSingleton();
      obj.extend(
        this,
        config.mixin(
          _.config,
          'cid',
          'target',
          'rootId',
          'zIndex'
        ),
        toggle,
        zIndex);
      this.dispatch = dispatch();
    },

    data: function(data) {
      var _ = this._;
      if (data) {
        _.dataCollection = data;
        return this;
      }
      if (!_.dataCollection) {
        return null;
      }
      return _.dataCollection.get(_.config.dataId);
    },

    scope: function() {
      return pubsub.scope(this._.config.rootId);
    },

    destroy: function() {
      var _ = this._;
      array.getArray(_.config.components).forEach(function(component) {
        component.destroy();
      });
      if(_.root) {
        _.root.remove();
      }
      this._ = null;
      this.dispatch.destroy.call(this);
    },

    render: function() {
      // noop
      return this;
    },

    isRendered: function() {
      return !!this.root();
    },

    update: function() {
      // noop
      return this;
    },

    on: function(eventName, callback) {
      var _ = this._;
      _.globalPubsub.sub(this.scope(
          this._.config.rootId)(eventName), callback);
    },

    off: function(eventName, callback) {
      var _ = this._;
      _.globalPubsub.unsub(this.scope(
          this._.config.rootId)(eventName), callback);
    }

  };

});
