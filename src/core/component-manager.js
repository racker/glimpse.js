/**
 * @fileOverview
 * Manages a collection of components.
 */
define([
  'core/object',
  'core/array',
  'core/string',
  'core/function',
  'components/component'
],
function(obj, array, string, func, components) {
  'use strict';

  var staticMethods;

  /**
   * Determins if something is a config object or not.
   *
   * @private
   * @param {*} obj
   * @return {Boolean}
   */
  function isConfig(obj) {
    // All components are functions.
    var first = obj;
    if (Array.isArray(obj)) {
      first = obj[0];
    }
    return typeof first === 'object' ? true : false;
  }

  /**
   * Compares a component to a cid.
   *
   * @private
   * @param {String} x
   * @param {components.*} c
   * @return {Boolean}
   */
  function cidComparer(x, c) {
    return c.cid() === x;
  }

  /**
   * Maps a component to its cid.
   *
   * @private
   * @param {components.*} c
   * @return {String|null}
   */
  function cidMapper(c) {
    return c.cid();
  }

  /**
   * Adds a random string as a cid for any component which lacks a cid.
   *
   * @private
   * @param {Array} components
   */
  function validateCids(components) {
    components.forEach(function(c) {
      if (!c.cid()) {
        c.cid(string.random());
      }
    });
  }

  staticMethods = {

    /**
     * Creates a new instance of a component manager object.
     *
     * @param {Array} optComponents An array of components to add
     *    to the colleciton.
     * @return {core.component-manager}
     */
    create: function(optComponents) {
      var mgr = componentManager();
      if (optComponents) {
        mgr.add(optComponents);
      }
      return mgr;
    },

    /**
     * Parses a component or list of components from config(s).
     * TODO: Recursively parse child components too.
     *
     * @return {Array} An array of components.
     */
    parse: function(configs) {
      return array.getArray(configs).map(function(cnf) {
        return components[cnf.type]().config(cnf);
      });
    },

    /**
     * Serializes out all of the components into a group of configs.
     * TODO: Deep serialization by including child components.
     *
     * @return {Array} An array of component config JSON objects.
     */
    serialize: function(components) {
      return array.getArray(components).map(function(c) {
        return c.config();
      });
    }

  };

  function componentManager() {
    var componentList,
        sharedObjects,
        cidList;

    // Key value pair of all registered object refs shared across components.
    // Are in the format:
    //   { 'methodName': { value: sharedObjectValue, autoApply: false } }
    sharedObjects = {};

    // Internal array of all the components.
    componentList= [];

    //Internal obj of all ids
    cidList = {};

    return obj.extend({

      /**
       * Gets all components.
       * Optionally filters by cids.
       *
       * @param {Array|string|undefined} cids An array of cids.
       * @return {Array} All the matching components.
       */
      get: function(cids) {
        var component;

        if (!cids) {
          // Return a copy of all.
          return componentList.concat();
        }
        if (typeof cids === 'string') {
          component = array.find(componentList,
            func.partial(cidComparer, cids));
          return component ? [component] : [];
        }
        return this.filter(function(c) {
          return array.contains(cids, c.cid());
        }, this);
      },

      /**
       * Gets the first element in the resulting list of matching cids.
       *
       * @public
       * @param {Array} cids
       * @return {components.*|null}
       */
      first: function(cids) {
        var values;
        values = this.get(cids);
        return values.length ? values[0] : null;
      },

      /**
      * Event dispatcher.
      * @public
      */
      dispatch: d3.dispatch('error'),

      /**
       * Adds a new component to the collection.
       *
       * Example:
       *   add(component)
       *   add(componentConfig)
       *
       * @param {Array|Object|components.*} A component or a component config.
       * @return {Array} An array of created components.
      */
      add: function(config) {
        var instances, newCids;

        instances = config;
        if (isConfig(instances)) {
          instances = staticMethods.parse(instances);
        } else {
          instances = array.getArray(instances);
        }
        validateCids(instances);

        instances.forEach(function(c) {
          if(cidList[c.cid()]){
            this.dispatch.error();
            return;
          }
          cidList[c.cid()] = true;
          componentList.push(c);
        }, this);
        
        newCids = instances.map(cidMapper);
        this.applyAutoSharedObjects(newCids);
        return instances;
      },

      /**
       * Get all the cids of all the components.
       *
       * @return {Array} An array of cid strings.
       */
      cids: function() {
        return componentList.map(cidMapper);
      },

      /**
       * Applies a custom filter to the collection.
       *
       * @param {Function} fn
       * @param {Object} context
       * @return {Array} An array of matching components.
       */
      filter: function(fn, context) {
        return componentList.filter(fn, context);
      },
      /**
       * Removes components from the collection (without destroying them).
       * Also removes the cids from the the cidList.
       *
       * @param {Array|undefined} cids The cids of the comonents to remove.
       *    If not provided will remove all components.
       * @return {core.comopnent-manager}
       */
      remove: function(cids) {
        array.remove(componentList, this.get(cids));
        obj.remove(cidList, cids);
        return this;
      },

      /**
       * Destroys and removes specified component(s).
       *
       * @param {Array} cids
       * @return {core.component-manger}
       */
      destroy: function(cids) {
        this.get(cids).forEach(function(c) {
          c.destroy();
        });
        this.remove(cids);
        return this;
      },

      /**
       * Calls the same method on all the components.
       * Optionally filters by cids.
       *
       * @param {String} method The method name.
       * @param {Array|undefined} cids The cids to filter by.
       * @param {arguments} ... Any other args to pass to the method.
       * @return {core.component-manager}
       */
      applyMethod: function(method, cids) {
        var args = array.convertArgs(arguments, 2);
        this.get(cids).forEach(function(c) {
          if (typeof c[method] === 'function') {
            c[method].apply(c, args);
          }
        });
        return this;
      },

      /**
       * Registers a new shared object which may be set on any/all of the
       *   components.
       *
       * @public
       * @param {String} name
       * @param {*} value
       * @param {Boolean|undefined} optAutoApply
       * @return {core.component-manager}
       */
      registerSharedObject: function(name, value, optAutoApply) {
        sharedObjects[name] = {
          value: value,
          autoApply: optAutoApply || false
        };
        return this;
      },

      /**
       * Gets all the registered shared objects.
       *
       * @public
       * @return {Object}
       */
      getSharedObjects: function() {
        return sharedObjects;
      },

      /**
       * Sets the matching shared object on all components.
       *   Assumes that "name" is a setter method on the component.
       *
       * @public
       * @param {String} name
       * @param {Array} cids
       * @param {Boolean} optSupressUpdate
       * @return {core.component-manager}
       */
      applySharedObject: function(name, cids, optSupressUpdate) {
        if (sharedObjects[name]) {
          this.applyMethod(name, cids, sharedObjects[name].value);
          if (!optSupressUpdate) {
            this.update(cids);
          }
        }
        return this;
      },

      /**
       * Applies all the shared objects configured to be automatically applied.
       *   Optionally limits to cids.
       *
       * @public
       * @param {Array|undefined} cids
       * @return {core.component-manager}
       */
      applyAutoSharedObjects: function(cids) {
        Object.keys(sharedObjects).forEach(function(name) {
          if (sharedObjects[name].autoApply) {
            this.applySharedObject(name, cids, true);
          }
        }, this);
        this.update(cids);
        return this;
      },

      /**
       * Sets data for components. Optionally filters by cid(s).
       *
       * @param {data.collection} data The data colleciton to set.
       * @param {Array|undefined} cids Optionally filter by cids.
       */
      data: function(data, cids) {
        return this.applyMethod('data', cids, data);
      },

      /**
       * Renders component(s).
       *
       * @param {d3.selection|string} selection
       * @param {Array} cids Optional array of component ids.
       */
      render: function(selection, cids) {
        return this.applyMethod('render', cids, selection);
      },

      /**
       * Updates all components by default, or limit to cids
       */
      update: function(cids) {
        return this.applyMethod('update', cids);
      },

      /**
       * Show component(s) optionally restricted to provided cids.
       */
      show: function(cids) {
        return this.applyMethod('show', cids);
      },

      /**
       * Hide component(s) optionally restricted to provided cids.
       */
      hide: function(cids) {
        return this.applyMethod('hide', cids);
      }

    });
  }

  return staticMethods;

});
