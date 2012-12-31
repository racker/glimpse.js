define([
  'd3',
  'obj/obj',
  'core/panel',
  'util/array',
  'core/component/legend',
  'core/component/axis',
  'events/observable'
],
function (d3, obj, panel, array, legend, axis, observable) {
  'use strict';

  // private variables
  var chartProto,
    panel_,
    dataset,
    components;

  chartProto = obj.extend({

    init: function () {
      this.config({
        'selection': null,
        'width': 600,
        'height': 400,
        'renderer': 'svg',
        'title': '',
        'xScale': null,
        'yScale': null,
        'legend': legend.new(),
        'xAxis': axis.new(),
        'yAxis': axis.new(),
        'axesVisible': 'always'
      });
      panel_ = panel.new();
      components = [];
      dataset = null;
      this.component(this.legend);
      this.component(this.xAxis);
      this.component(this.yAxis);
      this.registerEvents(['mouseover', 'click']);
      this.on('mouseover', function () {
        console.log(this.title);
      }.bind(this));
      return this;
    },

    // must be called whenever:
    // 1. data is changed
    // 2. components are added/removed
    // 3. height/width change
    updateScales: function () {
      var xExtents = [],
          yExtents = [];

      components.forEach(function (component) {
        if (component.data()) {
          xExtents = xExtents.concat(d3.extent(component.data(), component.x));
          yExtents = yExtents.concat(d3.extent(component.data(), component.y));
        }
      });

      if (!this.xScale) {
        this.xScale = d3.time.scale()
          .nice();
      }
      this.xScale
        .rangeRound([0, panel_.frameWidth()])
        .domain(d3.extent(xExtents));

      if (!this.yScale) {
        this.yScale = d3.scale.linear()
          .nice();
      }
      this.yScale
        .rangeRound([0, panel_.frameHeight()])
        .domain(d3.extent(yExtents));
    },

    data: function (data) {
      if (data) {
        dataset = data;
        if (components.length) {
          this.updateScales();
        }
        return this;
      }
      return dataset;
    },

    update: function () {
      // this.xScale.update();
      // this.yScale.update();
      // this.xAxis.update();
      // this.yAxis.update();
      return this;
    },

    render: function (selector) {
      var axesOpacity;

      if (!selector) {
        if (!this.selection) {
          return;
        }
      } else {
        this.selection = d3.select(selector);
      }
      panel_.config({
        'width': this.width,
        'height': this.height
      });
      // TODO: make legend optional
      this.legend.config({
        'id': 'legend',
        'marginLeft': panel_.marginLeft,
        'marginTop': Math.floor(panel_.marginTop / 2)
      });
      // TODO: make axes optional
      axesOpacity = this.axesVisible === 'always' ? 1 : 0;
      this.xAxis
        .config({
          'id': 'xAxis',
          'type': 'x',
          'orient': 'bottom',
          'opacity': axesOpacity
        });
      this.yAxis
        .config({
          'id': 'yAxis',
          'type': 'y',
          'orient': 'left',
          'opacity': axesOpacity
        });
      this.updateScales();
      panel_.render(this.selection);
      panel_.renderComponents(components);

      // show/hide axes on mouseover
      if (this.axesVisible === 'hover') {
        panel_.selection.on('mouseover', function () {
          this.xAxis.config('opacity', 1)
            .update();
          this.yAxis.config('opacity', 1)
            .update();
        }.bind(this));
        panel_.selection.on('mouseout', function () {
          this.xAxis.config('opacity', 0)
            .update();
          this.yAxis.config('opacity', 0)
            .update();
        }.bind(this));
      }

      return this;
    },

    component: function (component) {
      if (typeof component === 'string') {
        return array.find(components, function (c) {
          return c.id === component;
        });
      }
      component.data(dataset);
      components.push(component);
      this.updateScales();
      component.xScale = this.xScale;
      component.yScale = this.yScale;

      if (component.dataId) {
        this.legend.addKey(
            component.label || component.dataId, component.color);
      }
      return this;
    }
  }, observable);

  return chartProto;
});
