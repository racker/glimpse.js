/**
 * @fileOverview
 * An object that constructs/configures graphs by encapsulating complexity
 * in order to simplify the end-user api when generating typical graphs.
 *
 * "internal" refers to data/components added by this build and not by the user.
 */
define([
  'core/object',
  'core/array',
  'core/string',
  'core/format',
  'd3-ext/util',
  'graphs/graph',
  'events/pubsub'
],
function(obj, array, string, format, d3util, graph, pubsub) {
  'use strict';

    var defaults,
      config,
      globalPubsub,
      internalDataConfig,
      INTERNAL_COMPONENTS_CONFIG,
      GRAPH_TYPES;

    defaults = {
      layout: 'default'
    };

    config = {};

    globalPubsub = pubsub.getSingleton();

    /**
     * The supported types of pre-configured graphs.
     */
    GRAPH_TYPES = ['line', 'area', 'stacked-area'];

    /**
     * Dataset configurations automatically applied to graphs.
     */
    function getInternalDataConfig(domainSources) {
      return [{
        id: 'gl-stats',
        sources: [domainSources, '$domain'],
        derivation: function(sources, domain) {
          var xDomain, points, pointValues, result;

          result = {
            min: 0,
            max: 0,
            avg: 0
          };
          sources = sources.filterByTags('inactive');
          if (sources.all().length) {
            xDomain = domain.get().x;
            points = sources.filter('x', xDomain).dim('y').concat();
            pointValues = points.get();
            if (pointValues && pointValues.length) {
              result.min = points.min().round().get();
              result.max = points.max().round().get();
              result.avg = points.avg().round().get();
            }
          }
          return result;
        }
      }];
    }

    /**
     * Component configurations automatically applied to graphs.
     *
     * TODO: Externalize this once a component manager is available.
     */
    INTERNAL_COMPONENTS_CONFIG = [
      {
        cid: 'gl-stats',
        type: 'label',
        dataId: 'gl-stats',
        position: 'center-left',
        target: 'gl-footer',
        hiddenStates: ['empty', 'loading', 'error']
      },
      {
        cid: 'gl-domain-label',
        type: 'label',
        dataId: '$domain',
        position: 'center-right',
        target: 'gl-footer',
        hiddenStates: ['empty',  'loading', 'error']
      }
    ];

    /**
     * Determines if a data set corresponding to the data id is an internal
     * data set or not.
     *
     * @private
     * @param {String} dataId
     * @return {Boolean}
     */
    function isInternalData(dataId) {
      var foundData;
      foundData = array.find(internalDataConfig, function(d) {
        return d.id === dataId;
      });
      return foundData || string.startsWith(dataId, '$') ? true : false;
    }

    /**
     * Checks if a component alread exists in the componets collection with the
     * same data id.
     *
     * @param {String} dataId
     * @param {graphs.graph} g
     * @return {Boolean}
     */
    function componentExists(dataId, g) {
      var components, foundComponent;
      components = g.component().get();
      foundComponent = array.find(components, function(c) {
        return c.config('dataId') === dataId;
      });
      return foundComponent ? true : false;
    }

    /**
     * Adds a new component of the specified type for every supplied data id
     * that is not an internal data source.
     *
     * @private
     * @param {Array|Object} dataSources
     * @param {String} componentType
     * @param {graphs.graph} g
     */
    function addComponentsForDataSources(dataSources, componentType,
          g, sources, isStacked) {
      var id;
      array.getArray(dataSources).forEach(function(dataSource) {
        id = dataSource.id;
        if (isStacked) {
          id += '-stack';
        }
        if (!isInternalData(dataSource.id) &&
            !componentExists(dataSource.id, g)) {
          // If no sources are specified, add all data ids
          // else add the specified ones.
          if(sources.length === 0 || array.contains(sources, dataSource.id)) {
            g.component({
              type: componentType,
              dataId: id,
              cid: id,
              color: dataSource.color || null
            });
          }
        }
      });
    }

    /**
     * Overrides the removeData() funciton on the graph.
     * Additionally removes any corresponding components when called.
     *
     * TODO: remove this in favor of data collection events
     *
     * @private
     * @param {graphs.graph} g
     */
    function overrideRemoveDataFn(g) {
      var dataCollection = g.data();
      obj.override(dataCollection, 'remove', function(supr, dataId) {
        var args = array.convertArgs(arguments, 1);
        g.component().remove(dataId);
        return supr.apply(g, args);
      });
    }

    /**
     * Overrides the add() function on the graph's data collection. Anytime
     * add() is called a new component of the specified type will be added too.
     *
     * TODO: remove this in favor of data collection events
     *
     * @private
     * @param {String} componentType
     * @param {graphs.graph} g
     */
    function overrideAddDataFn(componentType, g, sources, isStacked) {
      var dataCollection = g.data();
      isStacked = isStacked || false;
      obj.override(dataCollection, 'add', function(supr, data) {
        var args, retVal;
        args = array.convertArgs(arguments, 1);
        retVal = supr.apply(dataCollection, args);
        if (isStacked) {
          array.getArray(data).forEach(function(ds) {
            supr.apply(dataCollection, [{
              id: ds.id + '-stack',
              sources: 'stacks',
              derivation: function(sources) {
                return sources.get().filter(function(source) {
                  return source.id === ds.id + '-stack';
                })[0];
              }
            }]);
          });
        }
        addComponentsForDataSources(data, componentType, g, sources, isStacked);
        return retVal;
      });
    }

    /**
     * Adds all pre-configured internal data sources to the graph.
     *
     * @private
     * @param {graphs.graph} g
     */
    function addInternalData(g) {
      internalDataConfig.forEach(function(dataConfig) {
        g.data().add(dataConfig);
      });
    }

    /**
     * TODO: Add capability to derivation to create sources.
     */
    function addStackedData(g) {
      var dataSources = [{
        id: 'stacks',
        sources: '*',
        derivation: function(sources) {
          return sources.stack().all();
        }
      }];
      g.data().add(dataSources);
    }

    /**
     * Adds all pre-configured internal components to the graph.
     *
     * @private
     * @param {graphs.graph} g
     */
    function addInternalComponents(g) {
      INTERNAL_COMPONENTS_CONFIG.forEach(function(componentConfig) {
        g.component(componentConfig);
      });
      g.component('gl-stats').text(function() {
        var unit, values, d;
        values = {
          avg: 0,
          min: 0,
          max: 0
        };
        d = this.data();
        unit = this.config().unit || '';
        if (d) {
          values.avg = d.avg || 0;
          values.min = d.min || 0;
          values.max = d.max || 0;
        }
        return 'Avg: ' + values.avg + unit +
               '    Min: ' +  values.min + unit +
               '    Max: ' + values.max + unit;
      });
      g.component('gl-domain-label').text(function() {
        var domain = this.data();
        if (domain) {
          return format.timeDomainUTC(domain.x, 'UTC');
        }
        return '';
      });
    }

    /**
     * Updates config for stats label
     */
    function updateStatsLabel() {
      var graph, componentManager, statsLabel;
      /*jshint validthis:true */
      graph = this;
      componentManager = graph.component();
      statsLabel =  componentManager.first('gl-stats');
      if (statsLabel) {
        statsLabel.config({
          unit: graph.config().yAxisUnit
        });
        componentManager.update('gl-stats');
      }
    }

    /**
     * An object that constructs/configures graphs by encapsulating complexity
     *   in order to simplify the end-user api.
     *
     * @public
     * @return {graphs.graphBuilder}
     */
    function graphBuilder() {
      obj.extend(config, defaults);
      return graphBuilder;
    }

    /**
     * Gets the available valid types to build pre-configured graphs.
     *
     * @public
     * @return {Array}
     */
    graphBuilder.types = function() {
      return GRAPH_TYPES;
    };

    /**
     * Build and return a new graph of the specified type.
     *
     * @param {String} type A valid pre-configured graph type.
     * @param {Object?} options Options for the pre-configured graph type.
     * @param {(Array.<string>|string)?} options.sources Definite list of
     *   sources that have corresponding graph components.
     * @return {graphs.graph}
     */
    graphBuilder.create = function(type, options) {
      var g, layout, sources, domainSources, scopeFn;

      options = options || {};
      layout = options.layout || 'default';
      sources = array.getArray(options.sources);
      domainSources = sources.join(',') || '*';
      internalDataConfig = getInternalDataConfig(domainSources);

      g = graph()
        .config({
          forceY: [0],
          layout: layout,
          yAxisUnit: 'ms',
          domainSources: domainSources
        });

      g.dispatch.on('update', updateStatsLabel);
      g.dispatch.on('render', function() {
        // subscribe to toggle event and update stats
        scopeFn = pubsub.scope(g.config('id'));
        globalPubsub.sub(scopeFn('data-toggle'), updateStatsLabel.bind(g));
      });

      addInternalData(g);
      addInternalComponents(g);

      switch (type) {
        case 'line':
        case 'area':
          overrideRemoveDataFn(g);
          overrideAddDataFn(type, g, sources, false);
          break;
        case 'stacked-area':
          addStackedData(g);
          overrideRemoveDataFn(g);
          overrideAddDataFn('area', g, sources, true);
          break;
      }
      return g;
    };

    return graphBuilder();
});
