/**
 * @fileOverview
 *
 * A reusable X-Y graph.
 */

define([
  'core/object',
  'core/config',
  'core/array',
  'components/component'
],
function (obj, config, array, components) {
  'use strict';

  return function () {

    /**
     * Private variables.
     */
    var config_,
      defaults_,
      data_,
      components_,
      xAxis_,
      yAxis_,
      panel_,
      legend_,
      svg_;

    /**
     * Private functions
     */
    var addComponent_,
      addAxes_,
      addLegend_,
      defaultXaccessor_,
      defaultYaccessor_,
      getFrameHeight_,
      getFrameWidth_,
      renderComponents_,
      renderComponentGroup_,
      renderDefs_,
      renderFramedComponentGroup_,
      renderPanel_,
      renderSvg_,
      update_,
      updateScales_,
      updateLegend_;

    config_ = {};

    defaults_ = {
      height: 700,
      width: 250,
      viewBoxHeight: 250,
      viewBoxWidth: 700,
      preserveAspectRatio: 'none',
      marginTop: 10,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 0,
      xScale: d3.time.scale(),
      yScale: d3.scale.linear(),
      showLegend: true
    };

    /**
     * @private
     * adds component to the components array
     * sets scales and data on the components
     * @param {component} component [description]
     */
    addComponent_ = function (component) {
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
     * @private
     * Adds axes to the components array
     */
    addAxes_ = function () {
      addComponent_(xAxis_);
      addComponent_(yAxis_);
    };

    /**
     * @private
     * Adds legend to the components array
     */
    addLegend_ = function () {
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
    defaultXaccessor_ = function (d) {
      return d.x;
    };

    /**
     * @private
     * Default x accessor for data
     * @param  {Object} d
     * @return {Object}
     */
    defaultYaccessor_ = function (d) {
      return d.y;
    };

    /**
     * @private
     * Calculates the frame height
     * @return {number}
     */
    getFrameHeight_ = function () {
      return config_.viewBoxHeight - config_.marginTop - config_.marginBottom;
    };

    /**
     * @private
     * Calculates the frame width
     * @return {number}
     */
    getFrameWidth_ = function () {
      return config_.viewBoxWidth - config_.marginLeft - config_.marginRight;
    };

    /**
     * @private
     * Sets the target selection and calls render on each component
     * @param  {d3.selection} selection
     */
    renderComponents_ = function (selection) {
      var framedGroup, unframedGroup;
      if (!components_) {
        return;
      }
      framedGroup = selection.select('.gl-components.gl-framed');
      unframedGroup = selection.select('.gl-components.gl-unframed');
      components_.forEach(function (component) {
        var renderTarget, componentConfig;
        if (component.config('isFramed')) {
          renderTarget = framedGroup;
          componentConfig = {
            'height': getFrameHeight_(),
            'width': getFrameWidth_()
          };
        } else {
          renderTarget = unframedGroup;
          componentConfig = {
            'height': config_.viewBoxHeight,
            'width': config_.viewBoxWidth
          };
        }
        component.config(componentConfig).render(renderTarget);
      });
    };

    /**
     * @private
     * Appends defs
     * @param  {d3.selection} selection
     */
    renderDefs_ = function (selection) {
      return selection.append('defs');
    };

    /**
     * @private
     * Appends g node to the selection
     * @param  {d3.selection} selection
     */
    renderComponentGroup_ = function (selection) {
      selection.append('g')
        .attr({
          'class': 'gl-components gl-unframed'
        });
    };

    /**
     * @private
     * Appends g node to the selection
     * @param  {d3.selection} selection
     */
    renderFramedComponentGroup_ = function (selection) {
      selection.append('g')
        .attr({
          'class': 'gl-components gl-framed',
          'transform':
            'translate(' + config_.marginLeft + ',' + config_.marginTop + ')'
        });
    };

    /**
     * @private
     * Appends svg node to the selection
     * @param  {d3.selection} selection
     */
    renderSvg_ = function (selection) {
      return selection.append('svg')
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
    };

    /**
     * @private
     * Sets up the panel(svg)
     * @param  {d3.selection} selection
     */
    renderPanel_ = function (selection) {
      svg_ = renderSvg_(selection);
      renderDefs_(svg_);
      renderComponentGroup_(svg_);
      renderFramedComponentGroup_(svg_);
    };

    /**
     * @private
     * Formats the keys for the legend and calls update on it
     */
    updateLegend_ = function () {
      var legendConfig = [];
      components_.forEach(function (c) {
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
     * @private
     * Updates the domain on the scales
     */
    updateScales_ = function () {
      var xExtents = [],
          yExtents = [];

      components_.forEach(function (component) {
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
      config_.xScale.rangeRound([0, getFrameWidth_()])
        .domain(d3.extent(xExtents));
      config_.yScale.rangeRound([getFrameHeight_(), 0])
        .domain([0, d3.max(yExtents)]);
    };

    /**
     * @private
     * Updates scales and legend
     */
    update_ = function () {
      updateScales_();
      updateLegend_();
    };

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(config_, defaults_);
      components_ = [];
      data_ = [];
      xAxis_ = components.axis().config({
        type: 'x',
        orient: 'bottom',
        scale: config_.xScale
      });
      yAxis_ = components.axis().config({
        type: 'y',
        orient: 'right',
        scale: config_.yScale
      });
      legend_ = components.legend();
      return graph;
    }

    /**
     * Gets/Sets the data
     * @param  {Object|Array} data
     * @return {graphs.graph|Object}
     */
    graph.data = function (data) {
      if (data) {
        // TODO: loop thru each data config and apply default X/Y
        // accessor functions
        if (Array.isArray(data)) {
          data_ = data_.concat(data);
        } else {
          data_.push(data);
        }
        return graph;
      }
      return data_;
    };

    /**
     * Creates and adds a component to the graph based on the type
     * or returns the component based on the id
     * @param  {string|Object} componentConfig
     * @return {component|graphs.graph}
     */
    graph.component = function (componentConfig) {
      var component;
      // No args. Return all components.
      if (!componentConfig) {
        // TODO: clone this?
        return components_;
      }
      // Single string indicates id of component to return.
      if (typeof componentConfig === 'string') {
        return array.find(components_, function (c) {
          return c.id() === componentConfig;
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
    graph.update = function () {
      update_();
      components_.forEach(function (component) {
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
    graph.render = function (selector) {
      var selection = d3.select(selector);
      addLegend_();
      addAxes_();
      renderPanel_(selection);
      update_();
      renderComponents_(svg_);
      return graph;
    };

    /**
     * Returns components of the graph
     * @return {Array}
     */
    graph.getComponents = function () {
      return components_;
    };

    /**
     * X-Axis
     * @param  {Object|} config
     * @return {components.axis|graphs.graph}
     */
    graph.xAxis = function (config) {
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
    graph.yAxis = function (config) {
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
    graph.legend = function (config) {
      if (config) {
        legend_.config(config);
        return graph;
      }
      return legend_;
    };

    obj.extend(graph, config(graph, config_, ['id', 'width', 'height']));
    return graph();
  };

});
