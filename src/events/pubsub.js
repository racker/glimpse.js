define([
  'core/array'
],
function(array) {
  'use strict';

  /**
   * A global singleton instance.
   * @private
   */
  var globalInstance;

  function broker() {
    var callbackCache;

    /**
     * Cache object to hold all the topics and callback references.
     * @private
     */
    callbackCache = {};

    return {

      /**
       * Publishes an event for a topic.
       * Also takes additional arguments to pass along to subscribers.
       *
       * @public
       * @param {String} topic The topic/event name.
       * @return {events.pubsub}
       */
      pub: function(topic) {
        var args;

        if (!callbackCache[topic]) {
          return this;
        }
        args = array.convertArgs(arguments, 1);
        callbackCache[topic].forEach(function(callback) {
          callback.apply(this, args);
        });
        return this;
      },

      /**
       * Subscribes to an event for a topic.
       *
       * @public
       * @param {String} topic The topic/event name.
       * @param {Function} callback
       * @return {events.pubsub}
       */
      sub: function(topic, callback) {
        if (!callbackCache[topic]) {
          callbackCache[topic] = [];
        }
        callbackCache[topic].push(callback);
        return this;
      },

      /**
       * Unsubscribe all, or just particular, callbacks from a topic.
       *
       * @public
       * @param {String} topic
       * @param {Array|Function} optCallbacks
       * @return {events.pubsub}
       */
      unsub: function(topic, optCallbacks) {
        var subscribers;

        // No callbacks specified, remove all for that topic.
        if (!optCallbacks) {
          delete callbackCache[topic];
          return this;
        }
        subscribers = callbackCache[topic] || [];
        // No subscribers to remove, return early.
        if (!subscribers.length) {
          return this;
        }
        // Only remove specified callbacks for topic.
        array.remove(subscribers, optCallbacks);
        return this;
      },

      /**
       * Unsubscribe everything and reset the cache.
       *
       * @public
       * @return {events.pubsub}
       */
      clearAll: function() {
        callbackCache = {};
        return this;
      }
    };
  }

  return {

    /**
     * Creates a new pubsub instance.
     *
     * @public
     * @return {events.pubsub}
     */
    create: function() {
      return broker();
    },

    /**
     * Returns the global singleton instance if it exists, otherwise creates it.
     *
     * @public
     * @return {events.pubsub}
     */
    getSingleton: function() {
      if (globalInstance) {
        return globalInstance;
      }
      globalInstance = this.create();
      return globalInstance;
    }

  };

});
