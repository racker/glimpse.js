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
  'components/component',
  'layout/layoutmanager',
  'd3-ext/util',
  'data/functions',
  'data/collection'
],
function(obj, config, array, assetLoader, components, layoutManager,
  d3util, dataFns, collection) {
  'use strict';

  return function() {

    /**
     * Private variables.
     */
    var config_,
      defaults_,
      components_,
      root_,
      xAxis_,
      yAxis_,
      legend_,
      addComponent_,
      addAxes_,
      addLegend_,
      configureXScale_,
      configureYScale_,
      defaultXaccessor_,
      defaultYaccessor_,
      getComponent_,
      renderComponents_,
      renderDefs_,
      renderPanel_,
      renderSvg_,
      toggle_,
      update_,
      updateScales_,
      updateLegend_,
      upsertData_,
      updateAxes_,
      showLoadingOverlay_,
      showEmptyOverlay_,
      showErrorOverlay_,
      showComponent,
      hideComponent,
      dataCollection_,
      isRendered_,
      updateStateDisplay,
      STATES,
      NO_COLORED_COMPONENTS,
      coloredComponentsCount,
      areComponentsRendered_;

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
      xScale: d3.time.scale.utc(),
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
      primaryContainer: 'gl-main'
    };

    /**
     * adds component to the components array
     * sets scales and data on the components
     * @private
     * @param {component} component [description]
     */
    addComponent_ = function(component) {
      if (component.data && !dataCollection_.isEmpty()) {
        component.data(dataCollection_);
      }
      if (component.xScale) {
        component.xScale(config_.xScale);
      }
      if (component.yScale) {
        component.yScale(config_.yScale);
      }
      if (!component.config('target')) {
        component.config('target', config_.primaryContainer);
      }
      setDefaultColor(component);
      components_.push(component);
    };

    /**
     * Adds axes to the components array
     * @private
     */
    addAxes_ = function() {
      addComponent_(xAxis_);
      addComponent_(yAxis_);
    };

    /**
     * Adds legend to the components array
     * @private
     */
    addLegend_ = function() {
      if (config_.showLegend) {
        addComponent_(legend_);
      }
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
     * Returns the component in the array
     * @param  {string|Array} cid
     * @return {Array|components.component}
     */
    getComponent_ = function(cid) {
      var cids,
          matches;
      cids = array.getArray(cid);
      matches = components_.filter(function(c) {
        return cids.indexOf(c.cid()) !== -1;
      });
      if (!matches.length) {
        return null;
      }
      return Array.isArray(cid) ? matches : matches[0];
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
     * Get X-extents for provided data
     * @param  {Object} componentData
     * @return {Array}
     */
    function getXExtents(componentData) {
      var extents = [];
      extents = d3.extent(
        componentData.data,
        dataFns.dimension(componentData, 'x')
      );
      if (d3util.isTimeScale(config_.xScale)) {
        return dataFns.toUTCDate(extents);
      }
      return extents;
    }

    /**
     * Sets the target selection and calls render on each component
     * @private
     */
    renderComponents_ = function() {
      if (!components_) {
        return;
      }
      components_.forEach(function(component) {
        component.render(root_);
      });
      areComponentsRendered_ = true;
    };

    /**
     * Appends defs
     * @private
     * @param  {d3.selection} selection
     */
    renderDefs_ = function(selection) {
      return selection.append('defs');
    };

    /**
     * Appends svg node to the selection
     * @private
     * @param  {d3.selection} selection
     */
    renderSvg_ = function(selection) {
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
    };

    /**
     * Sets up the panel(svg)
     * @private
     * @param  {d3.selection} selection
     */
    renderPanel_ = function(selection) {
      root_ = renderSvg_(selection);
      renderDefs_(root_);
      layoutManager.setLayout(
        config_.layout,
        root_,
        config_.viewBoxWidth,
        config_.viewBoxHeight);
    };

    /**
     * Toggles visibility of graph/components
     * @param  {string|Array} cid
     * @param  {bool} isVisible
     */
    toggle_ = function(cid, isVisible) {
      var display, comp;

      if (!cid) {
        display = isVisible ? null : 'none';
        root_.attr('display', display);
        return;
      }

      cid = array.getArray(cid);

      cid.forEach(function(id) {
        comp = getComponent_(id);
        if (comp) {
          if (isVisible) {
            comp.show();
          } else {
            comp.hide();
          }
        }
      });
    };

    /**
     * Formats the keys for the legend and calls update on it
     * @private
     */
    updateLegend_ = function() {
      var legendConfig = [];
      components_.forEach(function(c) {
        var cData = c.data ? c.data() : null;
        if (c.config('inLegend') && cData) {
          legendConfig.push({
            color: c.config('color'),
            label: c.data().title || ''
          });
        }
      });
      legend_.config({ cid: 'legend', keys: legendConfig })
        .update();
    };

    /**
     * configures the X scale
     * @param  {Array} xExtents
     */
    configureXScale_ = function(xExtents) {
      var max, min, offset, newMin;

      if (config_.forceX) {
        xExtents = xExtents.concat(config_.forceX);
      }

      max = d3.max(xExtents) || config_.xScale.domain()[1];
      min = d3.min(xExtents) || config_.xScale.domain()[0];

      if (d3util.isTimeScale(config_.xScale)) {
        if (config_.domainIntervalUnit) {
          offset = config_.domainIntervalUnit.offset(
            max,
            -(config_.domainIntervalPeriod || 1)
          );
          newMin = +min > +offset ? min : offset;
          min = newMin;
        }
      }

      xExtents = [min, max];
      config_.xScale.rangeRound([0, getPrimaryContainerSize()[0]])
        .domain(xExtents);
      return xExtents;
    };

    /**
     * configures the Y scale
     * @param  {Array} yExtents
     */
    configureYScale_ = function(yExtents) {
      yExtents.push(Math.round(d3.max(yExtents) * config_.yDomainModifier));

      if (config_.forceY) {
        yExtents = yExtents.concat(config_.forceY);
      }

      yExtents = d3.extent(yExtents);
      config_.yScale.rangeRound([getPrimaryContainerSize()[1], 0])
        .domain(yExtents);
      return yExtents;
    };

    /**
     * Updates the domain on the scales
     * @private
     */
    updateScales_ = function() {
      var xExtents = [],
        yExtents = [];

      components_.forEach(function(component) {
        var componentData;
        if (component.data) {
          componentData = component.data();
          if (componentData && componentData.data && componentData.dimensions) {
            xExtents = xExtents.concat(getXExtents(componentData));
            yExtents = yExtents.concat(
              d3.extent(componentData.data,
                function(d, i) {
                  var value = dataFns.dimension(componentData, 'y')(d, i);
                  // If Y-baselines are used (stacked),
                  //   use the sum of the baseline and Y.
                  if (componentData.dimensions.y0) {
                    value += dataFns.dimension(componentData, 'y0')(d, i);
                  }
                  return value;
                })
              );
          }
        }
      });
      xExtents = configureXScale_(xExtents);
      yExtents = configureYScale_(yExtents);
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
    };

    /**
     * Updates the config for the axes
     */
    updateAxes_ = function() {
      xAxis_.config({
        scale: config_.xScale,
        ticks: config_.xTicks,
        unit: config_.xAxisUnit
      });
      yAxis_.config({
        scale: config_.yScale,
        ticks: config_.yTicks,
        unit: config_.yAxisUnit
      });
    };

    /**
     * Updates scales and legend
     * @private
     */
    update_ = function() {
      updateScales_();
      dataCollection_.updateDerivations();
      updateAxes_();
      updateLegend_();
      if (isRendered_) {
        updateStateDisplay();
      }
    };

    /**
     * Inserts/Updates object in data array
     * @param  {object} data
     */
    upsertData_ = function(data) {
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
    };

    /**
     * Displays the empty message over the main container.
     * @private
     */
    showEmptyOverlay_ = function() {
      var labelTexts,
          overlay,
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
      overlay = components.overlay()
        .config({
          cid: 'emptyOverlay',
          layoutConfig: layoutConfig,
          components: labels
        });
      addComponent_(overlay);
      overlay.render(root_);
    };

    /**
     * Displays the loading spinner and message over the main container.
     * @private
     */
    showLoadingOverlay_ = function() {
      var label,
          spinner,
          overlay;

      spinner = components.asset().config({
        assetId: 'gl-asset-spinner'
      });
      label = components.label()
        .text(config_.loadingMessage)
        .config({
          color: '#666',
          fontSize: 13
        });
      overlay = components.overlay()
        .config({
          cid: 'loadingOverlay',
          components: [spinner, label]
        });
      addComponent_(overlay);
      overlay.render(root_);
    };

    /**
     * Displays the error icon and message over the main container.
     * @private
     */
    showErrorOverlay_ = function() {
      var label,
          icon,
          overlay;

      icon = components.asset().config({
        assetId: 'gl-asset-icon-error'
      });
      label = components.label()
        .text(config_.errorMessage)
        .config({
          color: '#C40022',
          fontSize: 13
        });
      overlay = components.overlay()
        .config({
          cid: 'errorOverlay',
          components: [icon, label]
        });
      addComponent_(overlay);
      overlay.render(root_);
    };

    /**
     * Initializes graph components
     * Adds legend/axes/domain label and
     * calls render on components
     */
    function initGraphComponents() {
      addLegend_();
      addAxes_();
      update_();
      renderComponents_();
    }

    /** Sets data on each component if data is set  */
    function setComponentsData() {
      if (!dataCollection_.isEmpty()) {
        components_.forEach(function(c){
          if (c.data) {
            c.data(dataCollection_);
          }
        });
      }
    }

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(config_, defaults_);
      components_ = [];
      dataCollection_ = collection.create();
      xAxis_ = components.axis()
        .config({
          axisType: 'x',
          orient: 'bottom',
          target: 'gl-xaxis',
          hiddenStates: ['empty', 'error', 'loading']
        });
      yAxis_ = components.axis()
        .config({
          axisType: 'y',
          orient: 'right',
          tickPadding: 5
        });
      legend_ = components.legend()
        .config({
          target: 'gl-info'
        });
      coloredComponentsCount = 0;
      return graph;
    }

    graph.STATES = STATES;

    /**
     * Shows a component if it is defined.
     * @private
     * @param {components.component}
     */
    showComponent = function(component) {
      if (component) {
        component.show();
      }
    };

    /**
     * Hides a component if it is defined.
     * @private
     * @param {components.component}
     */
    hideComponent = function(component) {
      if (component) {
        component.hide();
      }
    };

    /**
     * Adds/removes overlays & hides/shows components based on state.
     * @private
     */
    updateStateDisplay = function() {
      graph.removeComponent('emptyOverlay');
      graph.removeComponent('loadingOverlay');
      graph.removeComponent('errorOverlay');
      components_.forEach(function(c) {
        var hiddenStates = c.config('hiddenStates');
        if (array.contains(hiddenStates, config_.state)) {
          hideComponent(c);
        } else {
          showComponent(c);
        }
      });
      switch (config_.state) {
        case STATES.EMPTY:
          showEmptyOverlay_();
          break;
        case STATES.LOADING:
          showLoadingOverlay_();
          break;
        case STATES.ERROR:
          showErrorOverlay_();
          break;
      }
    };

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
      if (isRendered_) {
        updateStateDisplay();
      }
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
            upsertData_(data[i]);
          }
        } else {
          upsertData_(data);
        }
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
      var component;
      // No args. Return all components.
      if (!componentConfig) {
        // TODO: clone this?
        return components_;
      }
      // Single string indicates cid of component to return.
      if (typeof componentConfig === 'string') {
        return array.find(components_, function(c) {
          return c.cid() === componentConfig;
        });
      }
      component = components[componentConfig.type]();
      component.config(componentConfig);
      addComponent_(component);
      if (isRendered_) {
        component.render(root_);
      }
      return graph;
    };

    /**
     * @public
     * @param {String|Array} cid Component cid or array of cids to remove.
     * @return {graphs.graph}
     */
    graph.removeComponent = function(cid) {
      array.remove(components_, getComponent_(cid)).forEach(function(c) {
        c.destroy();
      });
      return graph;
    };

    /**
     * Updates the graph with new/updated data/config
     * @return {graphs.graph}
     */
    graph.update = function() {
      setComponentsData();
      if (!dataCollection_.isEmpty()) {
        if (!areComponentsRendered_) {
          initGraphComponents();
        }
        update_();
        components_.forEach(function(component) {
          component.update();
        });
      }
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
      renderPanel_(selection);

      if (!dataCollection_.isEmpty()) {
        initGraphComponents();
      }
      // Force state update.
      updateStateDisplay();
      isRendered_ = true;
      return graph;
    };

    graph.destroy = function() {
      config_.state = STATES.DESTROYED;
      graph.root().remove();
      config_ = null;
      defaults_ = null;
      // TODO: destroy all internal components too
    };

    /**
     * X-Axis
     * @param  {Object|} config
     * @return {components.axis|graphs.graph}
     */
    graph.xAxis = function(config) {
      if (config) {
        xAxis_.config(config);
        return graph;
      }
      return xAxis_;
    };

    /**
     * Y-Axis
     * @param  {Object} config
     * @return {graphs.graph|components.axis}
     */
    graph.yAxis = function(config) {
      if (config) {
        yAxis_.config(config);
        return graph;
      }
      return yAxis_;
    };

    /**
     * Legend
     * @param  {Object} config
     * @return {graphs.graph|component.legend}
     */
    graph.legend = function(config) {
      if (config) {
        legend_.config(config);
        return graph;
      }
      return legend_;
    };

     /**
     * Returns the root_
     * @return {d3.selection}
     */
    graph.root = function() {
      return root_;
    };

    /**
     * Shows components with provided cid/cids
     *   if no cid is provided, shows the graph
     * @param  {string|Array} cid
     * @return {graphs.graph}
     */
    graph.show = function(cid) {
      toggle_(cid, true);
      return graph;
    };

     /**
     * Hides components with provided cid/cids
     *   if no cid is provided, hides the graph
     * @param  {string|Array} cid
     * @return {graphs.graph}
     */
    graph.hide = function(cid) {
      toggle_(cid, false);
      return graph;
    };

    obj.extend(graph, config.mixin(config_, 'id', 'width', 'height'));
    return graph();
  };

});
