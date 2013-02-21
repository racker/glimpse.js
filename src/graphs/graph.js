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
  'core/format',
  'components/component',
  'layout/layoutmanager',
  'd3-ext/util'
],
function(obj, config, array, assetLoader, format, components, layoutManager,
  d3util) {
  'use strict';

  return function() {

    /**
     * Private variables.
     */
    var config_,
      defaults_,
      data_,
      components_,
      root_,
      xAxis_,
      yAxis_,
      legend_,
      xDomainLabel_,
      addComponent_,
      removeComponent_,
      addAxes_,
      addLegend_,
      configureXScale_,
      configureYScale_,
      defaultXaccessor_,
      defaultYaccessor_,
      getComponent_,
      getFrameHeight_,
      getFrameWidth_,
      renderComponents_,
      renderDefs_,
      renderPanel_,
      renderSvg_,
      toggle_,
      update_,
      updateScales_,
      updateLegend_,
      upsertData_,
      updateXDomainLabel_,
      updateAxes_,
      showLoadingOverlay_,
      showEmptyOverlay_,
      showErrorOverlay_,
      STATES;

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

    config_ = {};

    defaults_ = {
      layout: 'default',
      width: 700,
      height: 250,
      viewBoxHeight: 250,
      viewBoxWidth: 700,
      preserveAspectRatio: 'none',
      marginTop: 10,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 0,
      xScale: d3.time.scale(),
      yScale: d3.scale.linear(),
      showLegend: true,
      xDomainLabelFormatter: format.timeDomain,
      xTicks: 7,
      yTicks: 3,
      emptyMessage: 'No data to display',
      loadingMessage: 'Loading...',
      errorMessage: 'Error loading graph data',
      state: 'normal',
      yDomainModifier: 1.2
    };

    /**
     * @private
     * adds component to the components array
     * sets scales and data on the components
     * @param {component} component [description]
     */
    addComponent_ = function(component) {
      if (component.data) {
        component.data(data_);
      }
      if (component.xScale) {
        component.xScale(config_.xScale);
      }
      if (component.yScale) {
        component.yScale(config_.yScale);
      }
      components_.push(component);
    };

    /**
     * @param {String|Array} cid
     */
    removeComponent_ = function(cid) {
      array.remove(components_, getComponent_(cid)).forEach(function(c) {
        c.destroy();
      });
    };

    /**
     * @private
     * Adds axes to the components array
     */
    addAxes_ = function() {
      addComponent_(xAxis_);
      addComponent_(yAxis_);
    };

    /**
     * @private
     * Adds legend to the components array
     */
    addLegend_ = function() {
      if (config_.showLegend) {
        addComponent_(legend_);
      }
    };

    /**
     * @private
     * Default x accessor for data
     * @param  {Object} d
     * @return {Object}
     */
    defaultXaccessor_ = function(d) {
      return d.x;
    };

    /**
     * @private
     * Default x accessor for data
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
     * @private
     * Calculates the frame height
     * @return {number}
     */
    getFrameHeight_ = function() {
      return root_.select('.gl-framed').height();
    };

    /**
     * @private
     * Calculates the frame width
     * @return {number}
     */
    getFrameWidth_ = function() {
      return root_.select('.gl-framed').width();
    };

    /**
     * @private
     * Sets the target selection and calls render on each component
     * @param  {d3.selection} selection
     */
    renderComponents_ = function(selection) {
      if (!components_) {
        return;
      }
      components_.forEach(function(component) {
        var renderTarget;
        renderTarget = selection.select(
            component.config('target') || '.gl-unframed');
        component.render(renderTarget);
      });
    };

    /**
     * @private
     * Appends defs
     * @param  {d3.selection} selection
     */
    renderDefs_ = function(selection) {
      return selection.append('defs');
    };

    /**
     * @private
     * Appends svg node to the selection
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
     * @private
     * Sets up the panel(svg)
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
     * @private
     * Formats the keys for the legend and calls update on it
     */
    updateLegend_ = function() {
      var legendConfig = [];
      components_.forEach(function(c) {
        if (c.config('showInLegend')) {
          legendConfig.push({
            color: c.config('color'),
            label: c.data().title || ''
          });
        }
      });
      legend_.config({keys: legendConfig})
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

      //TODO: find a better way to check if the scale is a time scale
      if (config_.xScale.toString() === d3.time.scale().toString()) {

        if (config_.domainIntervalUnit) {
          offset = config_.domainIntervalUnit.offset(
            max,
            -(config_.domainIntervalPeriod || 1)
          );
          newMin = +min > +offset ? min : offset;
          min = newMin;
        }
      }

      config_.xScale.rangeRound([0, getFrameWidth_()])
        .domain([min, max]);
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

      config_.yScale.rangeRound([getFrameHeight_(), 0])
        .domain(d3.extent(yExtents));
    };

    /**
     * @private
     * Updates the domain on the scales
     */
    updateScales_ = function() {
      var xExtents = [],
        yExtents = [];

      components_.forEach(function(component) {
        var componentData;
        if (component.data) {
          componentData = component.data();
          if (componentData && componentData.data) {
            xExtents = xExtents.concat(
              d3.extent(componentData.data, componentData.x));
            yExtents = yExtents.concat(
              d3.extent(componentData.data, componentData.y));
          }
        }
      });
      configureXScale_(xExtents);
      configureYScale_(yExtents);
    };

    /**
     * Updates the config for the axes
     */
    updateAxes_ = function() {
      xAxis_.config({
        scale: config_.xScale,
        ticks: config_.xTicks
      });
      yAxis_.config({
        scale: config_.yScale,
        ticks: config_.yTicks
      });
    };

    /**
     * @private
     * Updates the text in the label showing the date range.
     * TODO: position this with layout manager
     */
    updateXDomainLabel_ = function() {
      xDomainLabel_
        .data(config_.xScale.domain())
        .text(config_.xDomainLabelFormatter);
    };

    /**
     * @private
     * Updates scales and legend
     */
    update_ = function() {
      updateScales_();
      updateAxes_();
      updateLegend_();
      updateXDomainLabel_();
    };

    /**
     * Inserts/Updates object in data array
     * @param  {object} data
     */
    upsertData_ = function(data) {
      var index = array.findIndex(data_, function(d) {
        return d.id === data.id;
      });
      if (index !== -1) {
        data_[index] = obj.extend(data_[index], data);
      } else {
        //Set default x and y accessors.
        if (!data.x) {
          data.x = defaultXaccessor_;
        }
        if (!data.y) {
          data.y = defaultYaccessor_;
        }
        data_.push(data);
      }
    };

    /**
     * @private
     * Displays the loading spinner and message over the framed area.
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
      overlay.render(root_.select('.gl-framed'));
    };

    /**
     * @private
     * Displays the loading spinner and message over the framed area.
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
      overlay.render(root_.select('.gl-framed'));
    };

    /**
     * @private
     * Displays the error icon and message over the framed area.
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
      overlay.render(root_.select('.gl-framed'));
    };

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(config_, defaults_);
      components_ = [];
      data_ = [];
      xAxis_ = components.axis()
        .config({
          'type': 'x',
          'orient': 'bottom',
          'target': '.gl-xaxis'
        });
      yAxis_ = components.axis()
        .config({
          'type': 'y',
          'orient': 'right'
        });
      legend_ = components.legend();
      xDomainLabel_ = components.label()
        .config({
          cid: 'xDomainLabel',
          target: '.gl-footer',
          position: 'center-right'
        });
      return graph;
    }

    graph.STATES = STATES;

    /**
     * Gets/sets the state of the graph.
     * @public
     * @return {graph.STATES}
     */
    graph.state = function(newState) {
      var oldState = config_.state;

      if (!newState) {
        return oldState;
      }
      removeComponent_('emptyOverlay');
      removeComponent_('loadingOverlay');
      removeComponent_('errorOverlay');
      graph.xAxis().show();
      graph.legend().show();
      switch (newState) {
        case STATES.EMPTY:
          showEmptyOverlay_();
          break;
        case STATES.LOADING:
          graph.xAxis().hide();
          graph.legend().hide();
          showLoadingOverlay_();
          break;
        case STATES.ERROR:
          graph.xAxis().hide();
          showErrorOverlay_();
          break;
        default:
          // Rest to normal if invalid state.
          newState = STATES.NORMAL;
      }
      config_.state = newState;
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
          return array.find(data_, function(d) {
            return d.id === data;
          });
        }
        if (Array.isArray(data)) {
          var i, len = data.length;
          for (i = 0; i < len; i++) {
            upsertData_(data[i]);
          }
        } else {
          upsertData_(data);
        }
        return graph;
      }

      return data_;
    };

    /**
     * Append data to an existing data object
     * @param  {string} id
     * @param  {Array|Object} dataToAppend
     * @return {graphs.graph}
     */
    graph.appendData = function (id, dataToAppend) {
      var index, originalData;

      index = array.findIndex(data_, function (d) {
        return d.id === id;
      });

      if (index !== -1) {
        if (Array.isArray(dataToAppend)) {
          originalData = data_[index].data;
          array.append(originalData, dataToAppend);
        } else {
          data_[index].data.push(dataToAppend);
        }
      }

      return graph;
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
      return graph;
    };

    /**
     * Updates the graph with new/updated data/config
     * @return {graphs.graph}
     */
    graph.update = function() {
      update_();
      components_.forEach(function(component) {
        component.update();
      });
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
      addLegend_();
      addAxes_();
      addComponent_(xDomainLabel_);
      renderPanel_(selection);
      update_();
      renderComponents_(root_);
      return graph;
    };

    graph.destroy = function() {
      config_.state = STATES.DESTROYED;
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
