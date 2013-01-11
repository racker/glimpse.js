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
    var config_ = {},
      defaults_ = {
        marginTop: 10,
        marginRight: 0,
        marginBottom: 20,
        marginLeft: 0,
        xScale: null,
        yScale: null
      },
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

    function getFrameHeight() {
      return config_.height - config_.marginTop - config_.marginBottom;
    }

    function getFrameWidth() {
      return config_.width - config_.marginLeft - config_.marginRight;
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
      svg_ = renderSvg(selection);
      renderDefs(svg_);
      renderComponentGroup(svg_);
      renderFramedComponentGroup(svg_);
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

    function updateScales() {
      var xExtents = [],
          yExtents = [];

      components_.forEach(function (component) {
        if (component.data) {
          xExtents = xExtents.concat(
            d3.extent(component.data().data, component.data().x));
          yExtents = yExtents.concat(
            d3.extent(component.data().data, component.data().y));
        }
      });
      config_.xScale.rangeRound([0, getFrameWidth()])
        .domain(d3.extent(xExtents));
      config_.yScale.rangeRound([0, getFrameHeight()])
        .domain(d3.extent(yExtents));
    }

    function graph() {
      obj.extend(config_, defaults_);
      components_ = [];
      config_.xScale = d3.time.scale();
      config_.yScale = d3.scale.linear();

      return graph;
    }

    graph.data = function (data) {
      if (data) {
        // TODO: loop thru each data config and apply default X/Y
        // accessor functions
        data_ = data;
        return graph;
      }
      return data_;
    };

    graph.component = function (componentConfig) {
      var component = components[componentConfig.type]();
      component.config(componentConfig);
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
        xScale: config_.xScale,
        yScale: config_.yScale
      });
      //if (component.config('dataId')) {
        //legend_.addKey(
          //component.config('label') || component.config('dataId'),
          //component.config('color'));
      //}
      return graph;
    };

    graph.update = function () {
      return graph;
    };

    graph.render = function (selector) {
      var selection = d3.select(selector);
      renderPanel(selection);
      renderComponents(selection);
      return graph;
    };

    obj.extend(graph, config(graph, config_, ['width', 'height']));
    return graph();
  };

});
