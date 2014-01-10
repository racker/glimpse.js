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

    /**
     * Initalises all common component mixins, properties etc
     */
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

    /**
     * A standard implementaion of the data setter/getter of the component.
     */
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

    /**
     * Returns a pubsub event scoped to the rootId of the graph.
     * @param {String} The event name.
     * @return {String} The scoped (prefixed) event name.
     */
    globalScope: function(eventName) {
      if (this._.config.type !== 'graph') {
        return pubsub.scope(this._.config.rootId)(eventName);
      }
      return  pubsub.scope(this._.config.id)(eventName);
    },

    /**
     * Returns a scope local to the component i.e caller is a
     * graph: Events are scoped to the graph rootId
     * component: Events are scope to component cid
     * @param {String} eventName event name.
     * @return {String} The scoped (prefixed) event name.
     */
    scope: function(eventName) {
      var scope = this._.config.rootId;
      if (this._.config.type !== 'graph') {
        scope = [scope, this._.config.cid].join(':');
      }
      return pubsub.scope(scope)(eventName);
    },

    /**
     * A lifecyle method for cleaning up after the component.
     */
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

    /**
     * A lifecycle method for rendering the component.
     */
    render: function() {
      // noop
      return this;
    },

    /**
     * Returns a boolean indicating whether the component is rendered.
     * @return {Boolean}
     */
    isRendered: function() {
      return !!this.root();
    },

    /**
     * A lifecycle method for updating a rendered component.
     */
    update: function() {
      // noop
      return this;
    },

    /**
     * Event handler attacher.
     * Note: The events are scoped local to the component.
     * @param {String} eventName The event name
     * @param {Function} callback
     */
    on: function(eventName, callback) {
      var _ = this._;
      _.globalPubsub.sub(this.scope(eventName), callback);
    },

    /**
     * Event handler detacher.
     * If the callback isn't specified, it deregisters all subscribed events.
     * @param {String} eventName The event name
     * @param {Function?} callback
     */
    off: function(eventName, callback) {
      var _ = this._;
      _.globalPubsub.unsub(this.scope(eventName), callback);
    },

    /**
     * Event emitter.
     * @param {String} eventName The event name
     * @param {...} arguments The arguments that are passed to the callback.
     */
    emit: function(eventName) {
      var _ = this._,
          args = array.convertArgs(arguments);
      args[0] = this.scope(eventName);
      _.globalPubsub.pub.apply(this, args);
    }

  };

});
