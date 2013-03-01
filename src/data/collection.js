/**
 * @fileOverview
 * Data source mutators.
 */
define([
  'core/object',
  'core/array',
  'data/selection/selection',
  'data/selection/diff-quotient'
], function (obj, array, selection) {
  'use strict';

  function applyDerivation(dc, data) {
    var dataSelection = dc.select(data.sources),
        derivedData = data.derivation(dataSelection);
    if (typeof derivedData === 'object' &&
         !Array.isArray(derivedData)) {
      obj.extend(derivedData, data);
    }
    return derivedData;
  }

  function isDerived(data) {
    return data.sources || data.derivation;
  }

  function collection() {
    var dataCollection = {};
    return {

      /**
       * Add a data source.
       */
      add: function(data) {
        if (Array.isArray(data)) {
          data.forEach(this.add);
          return;
        }
        if (isDerived(data)) {
          dataCollection[data.id] = { glDerive: data };
        } else {
          dataCollection[data.id] = data;
        }
      },

      /**
       * Recalculate derived sources.
       */
      updateDerivations: function() {
        var data;
        Object.keys(dataCollection).forEach(function(k) {
          data = dataCollection[k];
          if(data.glDerive) {
            data.glDerivation = applyDerivation(this, data.glDerive);
          }
        }, this);
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
       * Accepts sources string of ids that are
       * delimited by a comma.
       */
      select: function(sources) {
        var dataSelection = selection.create(),
            ids, dataList, data;
        if(sources === '*') {
          dataList = [];
          Object.keys(dataCollection).forEach(function(k) {
            data = dataCollection[k];
            if(!isDerived(data) && !data.glDerive) {
              dataList.push(data);
            }
          });
          dataSelection.add(dataList);
        } else {
          ids = sources.split(',');
          ids.forEach(function(id) {
            data = dataCollection[id];
            if(data) {
              dataSelection.add(data);
            }
          });
        }

        return dataSelection;
      }
    };
  }

  return {
    create: function() {
      return collection();
    }
  };

});
