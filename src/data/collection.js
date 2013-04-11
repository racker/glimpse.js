/**
 * @fileOverview
 * Data source mutators.
 */
define([
  'core/object',
  'core/array',
  'data/selection/selection',
  'data/functions',
  'data/selection/diff-quotient'
], function (obj, array, selection, dataFns) {
  'use strict';

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

  function isDerivedDataConfig(data) {
    if (data) {
      return  obj.isDef(data.sources) ||
              obj.isDef(data.derivation);
    }
    return false;
  }

  function isWildCard(id) {
    return id === '*' || id === '+';
  }

  function getExtents(sources) {
    var tempArr = [];
    sources.forEach(function(arr) {
      tempArr = tempArr.concat(arr);
    });

    return d3.extent(tempArr);
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
      sources = sources.concat(
        s.split(',').filter(function(id) { return !isWildCard(id); }));
    });
    sources.forEach(function(id) {
      deriveDataById(id.trim(), data, deps, dataCollection, visited);
    });
    deps[id] = true;
    d.glDerivation = applyDerivation(dataCollection, d.glDerive);
  }

  function collection() {
    var dataCollection;

    dataCollection = {};
    return {

      /**
       * Add a data source.
       */
      add: function(data) {
        if (Array.isArray(data)) {
          data.forEach(this.add);
          return;
        }
        if (isDerivedDataConfig(data)) {
          dataCollection[data.id] = { glDerive: data };
        } else {
          dataCollection[data.id] = data;
        }
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
       * Update an item in place.
       */
      upsert: function(data) {
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
       * Get data source by id.
       */
      get: function(id) {
        if (id) {
          if (dataCollection[id]) {
            return dataCollection[id].glDerivation || dataCollection[id];
          }
          return  null;
        }
        return Object.keys(dataCollection).map(function(k) {
          var data = dataCollection[k];
          return data.glDerivation || data;
        });
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
          if(isWildCard(id)) {
            Object.keys(dataCollection).forEach(function(k) {
              if(!this.isDerived(k) || sources === '+') {
                dataList.push(this.get(k));
              }
            }, this);
          } else {
              id = id.trim();
              if(dataCollection[id]) {
                dataList.push(this.get(id));
              }
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
      },

      /**
       * Calculates the xExtents for the data collection
       * @param  {Array<string>| string of comma-delimited ids |
       *   wildcard (* for all non-derived sources)} sources
       * @return {Array<number>}
       */
      xExtents: function(sources) {
        var dataSelection;
        dataSelection = this.select(sources ? sources : '*');
        return getExtents(dataSelection.dim('x').extent().all());
      },

      /**
       * Calculates the yExtents for the data collection
       * @param  {Array<string>| string of comma-delimited ids |
       *   wildcard (* for all non-derived sources)} sources
       * @return {Array<number>}
       */
      yExtents: function(sources) {
        var dataSelection, yExtentsSelection;
        dataSelection = this.select(sources ? sources : '*');
        yExtentsSelection = dataSelection.map(function(ds) {
          return d3.extent(ds.data, function(d, i) {
            var value = dataFns.dimension(ds, 'y')(d, i);
            // If Y-baselines are used (stacked),
            //   use the sum of the baseline and Y.
            if (ds.dimensions.y0) {
              value += dataFns.dimension(ds, 'y0')(d, i);
            }
            return value;
          });
        });
        return getExtents(yExtentsSelection.all());
      }
    };
  }

  return {
    create: function() {
      return collection();
    }
  };

});
