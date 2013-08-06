define([
  'core/object',
  'core/config',
  'core/array',
  'mixins/toggle',
  'mixins/zIndex',
  'events/pubsub'
], function (obj, config, array, toggle, zIndex, pubsub) {

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

    globalScope: function(eventName) {
      return pubsub.scope(this._.config.rootId)(eventName);
    },

    scope: function(eventName) {
      var scope = this._.config.rootId;
      if (this._.config.type !== 'graph') {
        scope = [scope, this._.config.cid].join(':');
      }
      return pubsub.scope(scope)(eventName);
    },

    destroy: function() {
      var _ = this._;
      array.getArray(_.config.components).forEach(function(component) {
        component.destroy();
      });
      if(_.root) {
        _.root.remove();
      }
      this.emit('destroy');
      this._ = null;
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
      _.globalPubsub.sub(this.scope(eventName), callback);
    },

    off: function(eventName, callback) {
      var _ = this._;
      _.globalPubsub.unsub(this.scope(eventName), callback);
    },

    emit: function(eventName) {
      var _ = this._,
          args = array.convertArgs(arguments);
      args[0] = this.scope(eventName);
      _.globalPubsub.pub.apply(this, args);
    }

  };

});
