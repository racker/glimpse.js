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
        height: 700,
        width: 250,
        viewBoxHeight: 250,
        viewBoxWidth: 700,
        preserveAspectRatio: 'none',
        marginTop: 10,
        marginRight: 0,
        marginBottom: 30,
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
      return config_.viewBoxHeight - config_.marginTop - config_.marginBottom;
    }

    function getFrameWidth() {
      return config_.viewBoxWidth - config_.marginLeft - config_.marginRight;
    }

    function renderSvg(selection) {
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
            'height': config_.viewBoxHeight,
            'width': config_.viewBoxWidth
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
      config_.yScale.rangeRound([getFrameHeight(), 0])
        .domain([0, d3.max(yExtents)]);
    }

    function updateLegend() {
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
    }

    function defaultXaccessor (d) {
      return d.x;
    }

    function defaultYaccessor (d) {
      return d.y;
    }

    function update() {
      updateScales();
      updateLegend();
    }

    function addComponent(component) {
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
    }

    function graph() {
      obj.extend(config_, defaults_);
      components_ = [];
      data_ = [];
      config_.xScale = d3.time.scale();
      config_.yScale = d3.scale.linear();
      legend_ = components.legend();
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
      addComponent(legend_);
      addComponent(xAxis_);
      addComponent(yAxis_);

      return graph;
    }

    // TODO: maybe add common data thing as
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
      addComponent(component);
      return graph;
    };

    graph.update = function () {
      update();
      components_.forEach(function (component) {
        component.update();
      });
      return graph;
    };

    // NOTE: render() should only be called once
    graph.render = function (selector) {
      var selection = d3.select(selector);
      renderPanel(selection);
      update();
      renderComponents(svg_);
      return graph;
    };

    obj.extend(graph, config(graph, config_, ['width', 'height']));
    return graph();
  };

});
