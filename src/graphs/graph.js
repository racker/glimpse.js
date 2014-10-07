/**
 * @fileOverview
 *
 * A reusable X-Y graph.
 */
define([
  'core/object',
  'core/config',
  'core/array',
  'core/function',
  'core/asset-loader',
  'core/component-manager',
  'core/string',
  'components/component',
  'layout/layoutmanager',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'data/collection',
  'data/domain'
],
function(obj, config, array, fn, assetLoader, componentManager, string,
  components, layoutManager, d3util, mixins, dataFns, collection, domain) {
  'use strict';

  return function() {

    /**
     * Private variables.
     */
    var _ = {
      config: {}
    },
      STATES,
      NO_COLORED_COMPONENTS,
      coloredComponentsCount,
      componentManager_,
      isRendered;

    /**
     * @enum
     * The possible states a graph can be in.
     */
    STATES = {
      NORMAL: 'normal',
      EMPTY: 'empty',
      LOADING: 'loading',
      ERROR: 'error',
      DESTROYED: 'destroyed'
    };

    /**
     * Components that do not require a default color
     * @type {Array}
     */
    NO_COLORED_COMPONENTS = ['axis', 'legend', 'label'];

    _.defaults = {
      type: 'graph',
      layout: 'default',
      width: 700,
      height: 230,
      viewBoxHeight: 230,
      viewBoxWidth: 700,
      preserveAspectRatio: 'none',
      xScale: d3.time.scale.utc().domain([0, 0]),
      yScale: d3.scale.linear(),
      showLegend: true,
      xTicks: 7,
      yTicks: 3,
      emptyMessage: 'No data to display',
      loadingMessage: 'Loading...',
      errorMessage: 'Error loading graph data',
      state: 'normal',
      yDomainModifier: 1.2,
      yCompute: 'extent',
      colorPalette: d3.scale.category10().range(),
      xAxisUnit: null,
      yAxisUnit: null,
      primaryContainer: 'gl-main',
      domainIntervalUnit: null,
      id: null,
      domainSources: null,
      domainConfig: null,
      showTooltip: false
    };

    /**
     * Gets the main container selection.
     * @private
     * @return {d3.selection}
     */
    function getPrimaryContainer() {
      return _.root.selectAttr('gl-container-name', _.config.primaryContainer);
    }

    /**
     * Calculates the main container width/height
     * @private
     * @return {Array} Array of numbers [width, height]
     */
    function getPrimaryContainerSize() {
      return getPrimaryContainer().size();
    }

    /**
     * Sets default color for on component if color not set
     * @private
     * @param {Object} component [description]
     */
    function setDefaultColor(component) {
      var colors, len;

      if (!array.contains(NO_COLORED_COMPONENTS, component.config().type)){
        colors = d3.functor(_.config.colorPalette)();
        len = colors.length;
        if (component.hasOwnProperty('color')) {
          component.config().color = component.config().color ||
            colors[(coloredComponentsCount++) % len];
        }
      }
    }

    /**
     * Appends defs
     * @private
     * @param  {d3.selection} selection
     */
    function renderDefs(selection) {
      return selection.append('defs').attr({
        'xmlns': 'http://www.w3.org/1999/xhtml'
      });
    }

    /**
     * Appends svg node to the selection
     * @private
     * @param  {d3.selection} selection
     */
    function renderSvg(selection) {
      var svgElement;

      _.root = selection.append('svg')
        .attr({
          'version': '1.1',
          'xmlns': 'http://www.w3.org/2000/svg',
          'width': _.config.width,
          'height': _.config.height,
          'viewBox': [
            0,
            0,
            _.config.viewBoxWidth,
            _.config.viewBoxHeight].toString(),
          'preserveAspectRatio': _.config.preserveAspectRatio
        });

      // https://github.com/mbostock/d3/issues/1935
      svgElement = selection.select('svg')[0][0];
      svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      return _.root;
    }

    /**
     * Sets up the panel(svg)
     * @private
     * @param  {d3.selection} selection
     */
    function renderPanel(selection) {
      _.root = renderSvg(selection);
      renderDefs(_.root);
      layoutManager.setLayout(
        _.config.layout,
        _.root,
        _.config.viewBoxWidth,
        _.config.viewBoxHeight);
      _.root.select('g').attr('gl-id', _.config.id);
    }

    function getDomainConfig(sources) {
      return {
        x: {
          sources: sources,
          compute: 'interval',
          args: {
            unit: _.config.domainIntervalUnit,
            period: _.config.domainIntervalPeriod
          },
          modifier: {
            force: _.config.forceX
          },
          'default': [0, 0]
        },
        y: {
          sources: sources,
          compute: _.config.yCompute,
          modifier: {
            force: _.config.forceY,
            maxMultiplier: _.config.yDomainModifier
          },
          'default': [0, 0]
        }
      };
    }

    /**
     * Updates the domain on the scales
     * @private
     */
    function updateScales() {
      var graphDomain,
          domainSources,
          domainConfig;

      domainSources = _.config.domainSources || '*';
      domainConfig = getDomainConfig(domainSources);
      if (_.config.domainConfig) {
        domainConfig = obj.extend(domainConfig, _.config.domainConfig);
      }
      domain.addDomainDerivation(domainConfig, _.dataCollection);

      _.dataCollection.updateDerivations();
      graphDomain = _.dataCollection.get('$domain');
      if (_.dataCollection.select(domainSources).length() > 0) {
        _.config.xScale.rangeRound([0, getPrimaryContainerSize()[0]])
          .domain(graphDomain.x);

        _.config.yScale.rangeRound([getPrimaryContainerSize()[1], 0])
          .domain(graphDomain.y);
      }
    }

    /**
     * Add legend component to the graph
     */
    function addLegend() {
      if (!componentManager_.first('gl-legend') && _.config.showLegend) {
        componentManager_.add({
          cid: 'gl-legend',
          type: 'legend',
          target: 'gl-info'
        });
      }
    }

    /**
     * Formats the keys for the legend and calls update on it
     * @private
     */
    function updateLegend() {
      var legendKeys = [], legend;

      legend = componentManager_.first('gl-legend');

      if (!legend) {
        addLegend();
        legend = componentManager_.first('gl-legend');
      }

      if (legend) {
        componentManager_.get().forEach(function(c) {
          var cData = c.data ? c.data() : null;
          if (c.config('inLegend') && cData) {
            legendKeys.push({
              dataId: c.config('dataId'),
              color: c.config('color'),
              label: c.data().title || ''
            });
          }
        });
        componentManager_.first('gl-legend')
          .config({ keys: legendKeys })
          .update();
      }
    }

    /**
     * Updates all the special components.
     */
    function updateComponents() {
      var yaxisComponent,
        xaxisComponent, componentsToRender;
        xaxisComponent = componentManager_.first('gl-xaxis');
        if (xaxisComponent) {
          xaxisComponent.config({
            scale: _.config.xScale,
            ticks: _.config.xTicks,
            unit: _.config.xAxisUnit
          });
        }
        yaxisComponent = componentManager_.first('gl-yaxis');
        if (yaxisComponent) {
          yaxisComponent.config({
            scale: _.config.yScale,
            ticks: _.config.yTicks,
            unit: _.config.yAxisUnit,
            target: _.config.primaryContainer
          });
        }
        componentManager_.update();

        if (graph.isRendered()) {
          //Calls render on component if, it hasn't been called already
          componentsToRender = componentManager_.filter(function(c) {
            return !c.isRendered();
          });
          if (componentsToRender.length > 0) {
            componentManager_.render(
              graph.root(),
              componentsToRender.map(function(c) {
                return c.cid();
              })
            );
          }
        }

        updateLegend();
    }

    /**
     * Displays the empty message over the main container.
     * @private
     */
    function showEmptyOverlay() {
      var labelTexts,
          labels,
          layoutConfig;

      layoutConfig = {
        type: 'vertical', position: 'center', gap: 6
      };
      labelTexts = array.getArray(_.config.emptyMessage);
      labels = labelTexts.map(function(text, idx) {
        var label = components.label().text(text);
        if (idx === 0) {
          label.config({
            color: '#666',
            fontSize: 18,
            fontWeight: 'bold'
          });
        } else {
          label.config({
            color: '#a9a9a9',
            fontSize: 13
          });
        }
        return label;
      });
      graph.component({
          type: 'overlay',
          cid: 'gl-empty-overlay',
          layoutConfig: layoutConfig,
          components: labels
        });
      componentManager_.render(_.root, 'gl-empty-overlay');
    }

    /**
     * Displays the loading spinner and message over the main container.
     * @private
     */
    function showLoadingOverlay() {
      var label,
          spinner;

      spinner = components.asset().config({
        assetId: 'gl-asset-spinner'
      });
      label = components.label()
        .text(_.config.loadingMessage)
        .config({
          color: '#666',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-loading-overlay',
          components: [spinner, label]
        });
      componentManager_.render(_.root, 'gl-loading-overlay');
    }

    /**
     * Displays the error icon and message over the main container.
     * @private
     */
    function showErrorOverlay() {
      var label,
          icon;

      icon = components.asset().config({
        assetId: 'gl-asset-icon-error'
      });
      label = components.label()
        .text(_.config.errorMessage)
        .config({
          color: '#C40022',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-error-overlay',
          components: [icon, label]
        });
      componentManager_.render(_.root, 'gl-error-overlay');
    }

    /**
     * Determins if the domain is "empty" (both values are zero).
     * TODO: Move to data collection when ready.
     *
     * @private
     * @param {Array} domain A 2 element array.
     * @return {Boolean}
     */
    function domainIsEmpty(domain) {
      var d0, d1;

      d0 = domain[0];
      d1 = domain[1];
      if (d0 instanceof Date && d1 instanceof Date) {
        return d0.getTime() === 0 && d1.getTime() === 0;
      }
      return d0 === 0 && d1 === 0;
    }

    /**
     * Adds/removes overlays & hides/shows components based on state.
     * @private
     */
    function updateComponentVisibility() {
      componentManager_.destroy([
          'gl-empty-overlay',
          'gl-loading-overlay',
          'gl-error-overlay']);
      componentManager_.get().forEach(function(c) {
        var hiddenStates = c.config('hiddenStates'),
            dataId = c.config('dataId');
        if (array.contains(hiddenStates, _.config.state) ||
              (dataId && _.dataCollection.hasTags(dataId, 'inactive')) ||
              c.config('visible') === false) {
          c.hide();
        } else {
          c.show();
        }
      });
      switch (_.config.state) {
        case STATES.EMPTY:
          showEmptyOverlay();
          break;
        case STATES.LOADING:
          showLoadingOverlay();
          break;
        case STATES.ERROR:
          showErrorOverlay();
          break;
        case STATES.NORMAL:
          // Hide x-axis if theres no data.
          if (domainIsEmpty(_.config.xScale.domain())) {
            componentManager_.first('gl-xaxis').hide();
            componentManager_.first('gl-yaxis').hide();
          }
          break;
      }
    }

    /**
     * Handles mousemove event on the gl-main
     */
    function mousemove() {
      graph.handleGraphMouseMove(
        d3.event.target,
        graph.component(),
        graph.data(),
        _.globalPubsub);
    }

    /**
     * Handles mouseout event on the gl-main
     */
    function mouseout() {
      graph.handleGraphMouseOut(graph, _.globalPubsub);
    }

    /**
     * Adds a rect to capture mousemove and mouseout on
     * gl-main container
     */
    function configureTooltip() {
      var container = getPrimaryContainer();

      if (graph.config('showTooltip') &&
        container.select('.gl-graph-tooltip').empty()) {
        container.append('rect')
        .attr({
          'class': 'gl-graph-tooltip',
          height: container.height(),
          width: container.width(),
          fill: 'transparent'
        })
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);
      }
    }

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(_.config, _.defaults);

      obj.extend(graph, mixins.highlight);

      if (!obj.isDefAndNotNull(_.config.id)) {
        _.config.id = string.random();
      }
      _.dataCollection = collection.create();
      // TODO: move these specific components to graphBuilder.
      componentManager_ = componentManager.create([
        {
          cid: 'gl-xaxis',
          type: 'axis',
          axisType: 'x',
          orient: 'bottom',
          target: 'gl-xaxis',
          hiddenStates: ['empty', 'loading', 'error']
        },
        {
          cid: 'gl-yaxis',
          axisType: 'y',
          type: 'axis',
          orient: 'right',
          tickPadding: 5,
          hiddenStates: ['empty', 'loading', 'error']
        }
      ]);
      componentManager_
        .registerSharedObject('xScale', _.config.xScale, true)
        .registerSharedObject('yScale', _.config.yScale, true)
        .registerSharedObject('data', _.dataCollection, true);
      coloredComponentsCount = 0;
      return graph;
    }

    graph._ = _;

    obj.extend(
      graph,
      config.mixin(_.config, 'id', 'width', 'height'),
      mixins.component);

    graph.init();

    graph.STATES = STATES;

    /**
     * Configures the graph state and triggers overlays updates.
     * @public
     * @return {graph.STATES}
     */
    graph.state = function(newState) {
      var oldState = _.config.state;

      if (!newState) {
        return oldState;
      }
      _.config.state = newState;
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      graph.emit('state');
      return graph;
    };

    /**
     * Gets/Sets the data
     * @param  {Object|Array} data
     * @return {graphs.graph|Object}
     */
    graph.data = function(data) {
      if (data) {
        // Single string indicates id of data to return.
        if (typeof data === 'string') {
          return _.dataCollection.get(data);
        }
        array.getArray(data).forEach(function(d) {
          _.dataCollection.extend(d);
        });
        return graph;
      }

      return _.dataCollection;
    };

    /**
     * Creates and adds a component to the graph based on the type
     * or returns the component based on the cid.
     * @param  {string|Object} componentConfig
     * @return {component|graphs.graph}
     */
    graph.component = function(componentConfig) {
      var components;
      // No args. Return component manager.
      if (!componentConfig) {
        return componentManager_;
      }
      // Single string indicates cid of component to return.
      if (typeof componentConfig === 'string') {
        components = componentManager_.get(componentConfig);
        if (components.length) {
          return components[0];
        }
      }

      // Add component(s).
      components = componentManager_.add(componentConfig);
      components.forEach(function(c) {
        if (!c.config('target')) {
          c.config('target', _.config.primaryContainer);
        }
        setDefaultColor(c);
      });

      return graph;
    };

    /**
     * Updates the graph with new/updated data/config
     * @return {graphs.graph}
     */
    graph.update = function() {
      componentManager_
        .registerSharedObject('xScale', _.config.xScale, true)
        .registerSharedObject('yScale', _.config.yScale, true);
      componentManager_.applySharedObject('xScale');
      componentManager_.applySharedObject('yScale');
      componentManager_.applySharedObject('data');
      updateScales();
      updateComponents();
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      configureTooltip();
      graph.emit('update');
      return graph;
    };

    /**
     * Initial panel setup and rendering of the components
     * Note: should be called only once.
     * @param  {d3.selection|Node|string} selector
     * @return {graphs.graph}
     */
    graph.render = function(selector) {
      var selection = d3util.select(selector);

      assetLoader.loadAll();
      renderPanel(selection);
      //Add legend before applying shared objects.
      addLegend();
      componentManager_.registerSharedObject('rootId', _.config.id, true);
      componentManager_.applySharedObject('rootId', componentManager_.cids());
      graph.update();
      componentManager_.render(graph.root());
      // Update y-axis once more to ensure ticks are above everything else.
      componentManager_.update(['gl-yaxis']);
      // Force state update.
      updateComponentVisibility();
      isRendered = true;
      graph.emit('render');
      return graph;
    };

    /**
     * Has the graph been rendered or not.
     * @return {Boolean}
     */
    graph.isRendered = function() {
      return isRendered;
    };

    /**
     * Removes everything from the DOM, cleans up all references.
     * @public
     */
    graph.destroy = fn.compose.call(graph, graph.destroy, function() {
      componentManager_.destroy();
      componentManager_ = null;
    });

    return graph();
  };

});
