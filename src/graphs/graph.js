/**
 * @fileOverview
 *
 * A reusable X-Y graph.
 */
define([
  'core/object',
  'core/config',
  'core/array',
  'core/asset-loader',
  'core/component-manager',
  'components/component',
  'layout/layoutmanager',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'data/collection'
],
function(obj, config, array, assetLoader, componentManager, components,
  layoutManager, d3util, mixins, dataFns, collection) {
  'use strict';

  return function() {

    /**
     * Private variables.
     */
    var config_,
      defaults_,
      root_,
      defaultXaccessor_,
      defaultYaccessor_,
      dataCollection_,
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

    config_ = {};

    defaults_ = {
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
      colorPalette: d3.scale.category20().range(),
      xAxisUnit: null,
      yAxisUnit: null,
      primaryContainer: 'gl-main',
      domainIntervalUnit: null
    };

    /**
     * Default x accessor for data
     * @private
     * @param  {Object} d
     * @return {Object}
     */
    defaultXaccessor_ = function(d) {
      return d.x;
    };

    /**
     * Default x accessor for data
     * @private
     * @param  {Object} d
     * @return {Object}
     */
    defaultYaccessor_ = function(d) {
      return d.y;
    };

    /**
     * Gets the main container selection.
     * @private
     * @return {d3.selection}
     */
    function getPrimaryContainer() {
      return root_.selectAttr('gl-container-name', config_.primaryContainer);
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
        colors = d3.functor(config_.colorPalette)();
        len = colors.length;
        if (component.hasOwnProperty('color')) {
          component.config().color = component.config().color ||
            colors[(coloredComponentsCount += 1) % len];
        }
      }
    }

    /**
     * Appends defs
     * @private
     * @param  {d3.selection} selection
     */
    function renderDefs(selection) {
      return selection.append('defs');
    }

    /**
     * Appends svg node to the selection
     * @private
     * @param  {d3.selection} selection
     */
    function renderSvg(selection) {
      root_ = selection.append('svg')
        .attr({
          'width': config_.width,
          'height': config_.height,
          'viewBox': [
            0,
            0,
            config_.viewBoxWidth,
            config_.viewBoxHeight].toString(),
          'preserveAspectRatio': config_.preserveAspectRatio
        });
      return root_;
    }

    /**
     * Sets up the panel(svg)
     * @private
     * @param  {d3.selection} selection
     */
    function renderPanel(selection) {
      root_ = renderSvg(selection);
      renderDefs(root_);
      layoutManager.setLayout(
        config_.layout,
        root_,
        config_.viewBoxWidth,
        config_.viewBoxHeight);
    }

    /**
     * Updates the domain on the scales
     * @private
     */
    function updateScales() {
      var xExtents = [],
        yExtents = [],
        dataIds = [];

      componentManager_.get().forEach(function(component) {
        var componentData;
        if (component.data) {
          componentData = component.data();
          if (componentData && componentData.data && componentData.dimensions) {
            dataIds.push(component.config('dataId'));
          }
        }
      });

      if (dataIds.length > 0) {
        xExtents = calculateXExtents(dataIds);
        config_.xScale.rangeRound([0, getPrimaryContainerSize()[0]])
          .domain(xExtents);

        yExtents = calculateYExtents(dataIds);
        config_.yScale.rangeRound([getPrimaryContainerSize()[1], 0])
          .domain(yExtents);
        updateDomain(xExtents, yExtents);
      } else {
        updateDomain([0,0], [0,0]);
      }
    }

    /**
     * Updates $domain in the data collection
     * @param  {Array<number>} xExtents
     * @param  {Array<number>} yExtents
     */
    function updateDomain(xExtents, yExtents) {
      dataCollection_.add({
        id: '$domain',
        sources: '',
        derivation: function() {
          return {
            x: xExtents,
            y: yExtents
          };
        }
      });
    }

    /**
     * Calculates the Y extents
     * @param  {Array<string>} dataIds
     * @return {Array<number>}
     */
    function calculateYExtents(dataIds) {
      var yExtents;

      yExtents = dataCollection_.yExtents(dataIds);

      //TODO: move yDomainModifier and forceY to datacollection
      yExtents.push(Math.round(d3.max(yExtents) * config_.yDomainModifier));
      if (config_.forceY) {
        yExtents = yExtents.concat(config_.forceY);
      }
      return d3.extent(yExtents);
    }

    /**
     * Calculates the X extents
     * @param  {Array<string>} dataIds
     * @return {Array<number>}
     */
    function calculateXExtents(dataIds) {
      var xExtents;

      xExtents = dataCollection_.xExtents(dataIds);

      //TODO: move domainIntervalPeriod and forceX to datacollection
      if (config_.forceX) {
        xExtents = xExtents.concat(config_.forceX);
      }

      if (d3util.isTimeScale(config_.xScale)) {
        if (config_.domainIntervalUnit) {
          xExtents = appyDomainIntervalPeriod(xExtents);
        }
      }
      if (xExtents) {
        return d3.extent(xExtents);
      }
      return [0, 0];
    }

    /**
     * Applies domain interval period to the x domain
     * @param  {Array} extents
     * @return {Array}
     */
    function appyDomainIntervalPeriod(extents) {
      var max, min, offset, newMin;

      max = d3.max(extents) ? d3.max(extents) : config_.xScale.domain()[1];
      min = d3.min(extents) ? d3.min(extents) : config_.xScale.domain()[0];

      offset = config_.domainIntervalUnit.offset(
        max,
        -(config_.domainIntervalPeriod || 1)
      );
      newMin = +min > +offset ? min : offset;
      min = newMin;

      return [min, max];
    }

    /**
     * Formats the keys for the legend and calls update on it
     * @private
     */
    function updateLegend() {
      var legendConfig = [];
      componentManager_.get().forEach(function(c) {
        var cData = c.data ? c.data() : null;
        if (c.config('inLegend') && cData) {
          legendConfig.push({
            color: c.config('color'),
            label: c.data().title || ''
          });
        }
      });
      componentManager_.first('gl-legend')
        .config({ keys: legendConfig })
        .update();
    }

    /**
     * Updates all the special components.
     */
    function updateComponents() {
      componentManager_.first('gl-xaxis')
        .config({
          scale: config_.xScale,
          ticks: config_.xTicks,
          unit: config_.xAxisUnit
        });
      componentManager_.first('gl-yaxis')
        .config({
          scale: config_.yScale,
          ticks: config_.yTicks,
          unit: config_.yAxisUnit,
          target: config_.primaryContainer
        });
      componentManager_.update();
      updateLegend();
    }

    /**
     * Inserts/Updates object in data array
     * @param  {object} data
     */
    function upsertData(data) {
      //Set default x and y accessors.
      if(!data.dimensions) {
        data.dimensions = {};
      }
      if (!data.dimensions.x) {
        data.dimensions.x = defaultXaccessor_;
      }
      if (!data.dimensions.y) {
        data.dimensions.y = defaultYaccessor_;
      }
      dataCollection_.upsert(data);
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
      labelTexts = array.getArray(config_.emptyMessage);
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
      componentManager_.render(root_, 'gl-empty-overlay');
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
        .text(config_.loadingMessage)
        .config({
          color: '#666',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-loading-overlay',
          components: [spinner, label]
        });
      componentManager_.render(root_, 'gl-loading-overlay');
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
        .text(config_.errorMessage)
        .config({
          color: '#C40022',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-error-overlay',
          components: [icon, label]
        });
      componentManager_.render(root_, 'gl-error-overlay');
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
        var hiddenStates = c.config('hiddenStates');
        if (array.contains(hiddenStates, config_.state)) {
          c.hide();
        } else {
          c.show();
        }
      });
      switch (config_.state) {
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
          if (domainIsEmpty(config_.xScale.domain())) {
            componentManager_.first('gl-xaxis').hide();
            componentManager_.first('gl-yaxis').hide();
          }
          break;
      }
    }

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(config_, defaults_);
      dataCollection_ = collection.create();
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
          tickPadding: 5
        }
      ]);
      if (config_.showLegend) {
        componentManager_.add({
          cid: 'gl-legend',
          type: 'legend',
          target: 'gl-info'
        });
      }
      componentManager_
        .registerSharedObject('xScale', config_.xScale, true)
        .registerSharedObject('yScale', config_.yScale, true)
        .registerSharedObject('data', dataCollection_, true);
      coloredComponentsCount = 0;
      return graph;
    }

    obj.extend(
      graph,
      config.mixin(config_, 'id', 'width', 'height'),
      mixins.toggle);

    graph.STATES = STATES;

    /**
     * Event dispatcher.
     * @public
     */
    graph.dispatch = mixins.dispatch('state');

    /**
     * Configures the graph state and triggers overlays updates.
     * @public
     * @return {graph.STATES}
     */
    graph.state = function(newState) {
      var oldState = config_.state;

      if (!newState) {
        return oldState;
      }
      config_.state = newState;
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      graph.dispatch.state.call(this);
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
          return dataCollection_.get(data);
        }
        if (Array.isArray(data)) {
          var i, len = data.length;
          for (i = 0; i < len; i += 1) {
            upsertData(data[i]);
          }
        } else {
          upsertData(data);
        }
        componentManager_.applySharedObject('data');
        return graph;
      }

      return dataCollection_;
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
          c.config('target', config_.primaryContainer);
        }
        setDefaultColor(c);

        // TODO: Remove this once extents/domain is calculated properly.
        if (graph.isRendered()) {
          c.render(root_);
        }
      });

      return graph;
    };

    /**
     * Updates the graph with new/updated data/config
     * @return {graphs.graph}
     */
    graph.update = function() {
      updateScales();
      dataCollection_.updateDerivations();
      updateComponents();
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      graph.dispatch.update.call(this);
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
      graph.update();
      componentManager_.render(graph.root());
      // Update y-axis once more to ensure ticks are above everything else.
      componentManager_.update(['gl-yaxis']);
      // Force state update.
      updateComponentVisibility();
      isRendered = true;
      graph.dispatch.render.call(this);
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
    graph.destroy = function() {
      config_.state = STATES.DESTROYED;
      componentManager_.destroy();
      if (root_) {
        root_.remove();
        root_ = null;
      }
      config_ = null;
      defaults_ = null;
      componentManager_ = null;
      graph.dispatch.destroy.call(this);
    };

     /**
     * Returns the root_
     * @return {d3.selection}
     */
    graph.root = function() {
      return root_;
    };

    return graph();
  };

});
