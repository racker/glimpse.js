/**
 * @fileOverview
 * Data source mutators.
 */
define([
  'core/object',
  'core/array',
  'core/set',
  'data/selection/selection',
  'data/selection/diff-quotient'
], function (obj, array, set, selection) {
  'use strict';

  /**
   * Computes the derivation by calling the
   * derivation function with the sources it needs.
   */
  function applyDerivation(dc, data) {
    var dataSelections, derivedData;
    dataSelections = array.getArray(data.sources).map(function(d) {
      return dc.select(d);
    });
    derivedData = data.derivation.apply(null, dataSelections);
    if (typeof derivedData === 'object' &&
         !Array.isArray(derivedData)) {
      obj.extend(derivedData, data);
    }
    return derivedData;
  }

  /**
   * A data config is determined to derived config if
   * it contains a sources or derivation field.
   */
  function isDerivedDataConfig(data) {
    if (data) {
      return  obj.isDef(data.sources) ||
              obj.isDef(data.derivation);
    }
    return false;
  }

  /**
   * Adds a data source.
   * Tags non-derived sources with * and +.
   * Tags derived sources with +.
   */
  function addDataSource(dataCollection, data) {
    var id = data.id;
    if (isDerivedDataConfig(data)) {
      if (!obj.isDef(data.tags)) {
        data.tags = '+';
      }
      dataCollection[id] = { glDerive: data };
    } else {
      if (!obj.isDef(data.tags)) {
        data.tags = ['*', '+'];
      }
      dataCollection[id] = data;
    }
  }

  /**
   * @private
   * Derives data source by id.
   * Accepts the cached deps object.
   * Results in the derivation of any non-cached dependencies
   * of the data source.
   */
  function deriveDataById(id, data, deps, dataCollection, visited) {
    var d = data[id], sources;
    if(!dataCollection.isDerived(id)) {
      deps[id] = true;
      return;
    }
    visited = visited || [];
    if (deps[id]) {
      return;
    }
    if (array.contains(visited, id)) {
      deps[id] = true;
      // TODO: Make enum for errors.
      d.glDerivation = 'gl-error-circular-dependency';
    }
    visited.push(id);
    sources = [];
    array.getArray(d.glDerive.sources).forEach(function(s) {
      sources = sources.concat(s.split(','));
    });
    sources.forEach(function(id) {
      deriveDataById(id.trim(), data, deps, dataCollection, visited);
    });
    deps[id] = true;
    d.glDerivation = applyDerivation(dataCollection, d.glDerive);
  }

  function collection() {
    var dataCollection = {};

    return {

      /**
      * Event dispatcher.
      * @public
      */
      dispatch: d3.dispatch('error'),

      /**
       * Add a data source.
       * dispatch error event if id is not unique
       */
      add: function(data) {
        if (Array.isArray(data)) {
          data.forEach(this.add, this);
          return;
        }
        if (dataCollection[data.id]) {
          this.dispatch.error();
          return;
        }
        addDataSource(dataCollection, data);
      },

      /**
       * Adds a data source if it doesn't exist.
       * Replace a data source if it does.
       */
      upsert: function(data) {
        if (!dataCollection[data.id]) {
          this.add(data);
        }
        addDataSource(dataCollection, data);
      },

      isDerived: function(id) {
        var data = dataCollection[id];
        return obj.isDef(data) && obj.isDef(data.glDerive);
      },

      /**
       * Recalculate derived sources.
       */
      updateDerivations: function() {
        var deps = {};
        Object.keys(dataCollection).forEach(function(k) {
          deriveDataById(k, dataCollection, deps, this);
        }, this);
        return deps;
      },

      /**
       * Remove a data source by id.
       */
      remove: function(id) {
        var ids = array.getArray(id);
        ids.forEach(function(i) {
          delete dataCollection[i];
        });
      },

      /**
       * Extend a data-source in place.
       * If data source doesn't exist, it's added.
       */
      extend: function(data) {
        var id = data.id;
        if (dataCollection[id]) {
          obj.extend(dataCollection[id], data);
        } else {
          this.add(data);
        }
      },

      /**
       * Append data to a source by id.
       */
      append: function(id, dataToAppend) {
        var dataSource = this.get(id);
        if (dataSource) {
          if (Array.isArray(dataToAppend)) {
            array.append(dataSource.data, dataToAppend);
          } else {
            dataSource.data.push(dataToAppend);
          }
        }
      },

      /**
       * Returns the tag(s) of the datasource speciifed by its id.
       */
      getTags: function(id) {
        if (this.isDerived(id)) {
          return obj.get(dataCollection, [id, 'glDerive', 'tags']);
        }
        return obj.get(dataCollection, [id, 'tags']);

      },

      /**
       * Sets the tag(s) of the datasource speciifed by its id.
       */
      setTags: function(id, tags) {
        tags = set.create(tags).toArray();
        if (this.isDerived(id)) {
          dataCollection[id].glDerive.tags = tags;
        }
        dataCollection[id].tags = tags;
      },


      /**
       * Adds tag(s) to a datasource by id.
       * If tag is already present, no operation is performed.
       */
      addTags: function(id, tags) {
        var tagSet = set.create(this.getTags(id));
        tagSet.add(tags);
        this.setTags(id, tagSet.toArray());
      },

      /**
       * Removes tag(s) from a datasource by id.
       * If tag isn't present, no operation is performed.
       */
      removeTags: function(id, tags) {
        var tagSet = set.create(this.getTags(id));
        tagSet.remove(tags);
        this.setTags(id, tagSet.toArray());
      },

      /**
       * Togggles the presence the of the given tags with the
       * datasource with the associated id.
       * In other words,
       * Adds a tag if it isn't present.
       * Removes a tag if it is present.
       */
      toggleTags: function(id, tags) {
        var tagSet = set.create(this.getTags(id));
        tags = array.getArray(tags);
        tagSet.toggle(tags);
        this.setTags(id, tagSet.toArray());
      },

      /**
       * Get data source by id.
       */
      get: function(id) {
        if (obj.get(dataCollection, id)) {
          if (this.isDerived(id)) {
            return dataCollection[id].glDerivation ||
                   'gl-error-not-computed';
          }
          return dataCollection[id];
        }
        if (arguments.length === 0) {
          return Object.keys(dataCollection).map(function(k) {
            var data = dataCollection[k];
            return data.glDerivation || data;
          });
        }
        return null;
      },

      /**
       * Accepts the following string of comma-delimited:
       * ids
       * wildcards (* for all non-derived sources, + for all sources)
       */
      select: function(sources) {
        var dataSelection = selection.create(),
            dataList = [], ids = [];
        array.getArray(sources).forEach(function(s) {
          ids = ids.concat(s.split(','));
        });
        ids.forEach(function(id) {
          id = id.trim();
          if(dataCollection[id]) {
            dataList.push(this.get(id));
          } else {
            Object.keys(dataCollection).forEach(function(k) {
              var data;
              if(this.isDerived(k)) {
                data = dataCollection[k].glDerive;
              } else {
                data = dataCollection[k];
              }
              if(array.contains(data.tags, id)) {
                dataList.push(this.get(k));
              }
            }, this);
          }
        }, this);
        dataSelection.add(dataList);
        return dataSelection;
      },

      /**
       * Checks whether dataCollection is empty
       * @return {Boolean}
       */
      isEmpty: function() {
        return Object.keys(dataCollection).length === 0;
      }
    };
  }

  return {

    /**
     * Creates a new collection.
     */
    create: function() {
      return collection();
    }
  };

});
