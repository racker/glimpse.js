/**
 * @fileOverview
 *
 * A cartesian time-series chart.
 */
define([
  'd3',
  'util/obj',
  'util/array',
  'core/component/legend',
  'core/component/axis',
  'mixins/configurable',
  'mixins/observable'
],
function (d3, obj, array, legend, axis, configurable, observable) {
  'use strict';

  return function (defaults) {

    /**
     * Private variables
     */
    var config_ = obj.empty(),
      xScale_,
      yScale_,
      xAxis_,
      yAxis_,
      legend_,
      data_,
      components_,
      defaults_ = {
        height: 300,
        width: 500,
        marginTop: 30,
        marginRight: 0,
        marginBottom: 50,
        marginLeft: 0
      };

    /**
     * Private functions
     */

    function getFrameHeight() {
      return config_.height - config_.marginTop - config_.marginBottom;
    }

    function getFrameWidth() {
      return config_.width - config_.marginLeft - config_.marginRight;
    }

    function updateScales() {
      var xExtents = [],
          yExtents = [];

      components_.forEach(function (component) {
        if (component.data) {
          xExtents = xExtents.concat(
            d3.extent(component.data(), component.config('x')));
          yExtents = yExtents.concat(
            d3.extent(component.data(), component.config('y')));
        }
      });
      xScale_.rangeRound([0, getFrameWidth()])
        .domain(d3.extent(xExtents));
      yScale_.rangeRound([0, getFrameHeight()])
        .domain(d3.extent(yExtents));
    }

    function renderSvg(selection) {
      return selection.append('svg')
        .attr({
          'width': config_.width,
          'height': config_.height,
          'font-family': config_.fontFamily,
          'font-size': config_.fontSize
        });
    }

    function renderDefs(selection) {
      return selection.append('defs');
    }

    function renderFramedComponentGroup(selection) {
      selection.append('g')
        .attr({
          'class': 'components framed',
          'transform':
            'translate(' + config_.marginLeft + ',' + config_.marginTop + ')'
        });
    }

    function renderComponentGroup(selection) {
      selection.append('g')
        .attr({
          'class': 'components unframed'
        });
    }

    function renderPanel(selection) {
      var svg = renderSvg(selection);
      renderDefs(svg);
      renderComponentGroup(svg);
      renderFramedComponentGroup(svg);
    }

    function renderComponents(selection) {
      var framedGroup, unframedGroup;
      if (!components_) {
        return;
      }
      framedGroup = selection.select('.components.framed');
      unframedGroup = selection.select('.components.unframed');
      components_.forEach(function (component) {
        var renderTarget, componentConfig;
        if (component.config('isFramed')) {
          renderTarget = framedGroup;
          componentConfig = {
            'height': getFrameHeight(),
            'width': getFrameWidth()
          };
        } else {
          renderTarget = unframedGroup;
          componentConfig = {
            'height': config_.height,
            'width': config_.width
          };
        }
        component.config(componentConfig).render(renderTarget);
      });
    }

    /**
     * The main function that gets returned.
     */
    function chart(defaults) {
      defaults_ = defaults || defaults_;
      obj.extend(config_, defaults_);
      chart.registerEvents(['mouseover', 'click']);

      xScale_ = d3.time.scale()
        .nice();
      yScale_ = d3.scale.linear()
        .nice();
      xAxis_ = axis();
      yAxis_ = axis();
      legend_ = legend();
      components_ = [];
      chart.component(legend_);
      chart.component(xAxis_);
      chart.component(yAxis_);
      return chart;
    }

    /**
     * Public methods on the main function object.
     */

    chart.update = function () {

      updateScales();

      xAxis_
        .config({
          'id': 'xAxis',
          'type': 'x',
          'orient': 'bottom'
          //'opacity': axesOpacity
        });
      //xAxis_.update();

      yAxis_
        .config({
          'id': 'yAxis',
          'type': 'y',
          'orient': 'right'
          //'opacity': axesOpacity
        });
      //yAxis_.update();

      // TODO: make legend optional
      legend_.config({
        'id': 'legend',
        'marginLeft': config_.marginLeft,
        'marginTop': Math.floor(config_.marginTop / 2) || 0
      });
      legend_.update();

      return chart;
    };

    chart.render = function (selector) {
      var selection = d3.select(selector);
      chart.update();
      renderPanel(selection);
      renderComponents(selection);
      return chart;
    };

    chart.data = function (data) {
      if (data) {
        data_ = data;
        if (components_.length) {
          updateScales();
        }
        return chart;
      }
      return data_;
    };

    chart.component = function (component) {
      if (typeof component === 'string') {
        return array.find(components_, function (c) {
          return c.id === component;
        });
      }
      if (component.data) {
        component.data(data_);
      }
      components_.unshift(component);
      updateScales();
      component.config({
        xScale: xScale_,
        yScale:  yScale_
      });
      if (component.config('dataId')) {
        legend_.addKey(
          component.config('label') || component.config('dataId'),
          component.config('color'));
      }
      return chart;
    };

    /**
     * Mixin other public functions.
     */

    obj.extend(chart,
      configurable(chart, config_, ['width', 'height', 'legend']),
      observable(chart));

    return chart(defaults);
  };

});
