/**
 * @fileOverview
 * Area component to draw filled areas in 2d space.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions'
],
function(array, config, obj, string, d3util, mixins, dataFns) {
  'use strict';

  return function() {

    //Private variables
    var config_ = {},
      defaults_,
      dataCollection_,
      root_;

    defaults_ = {
      type: 'area',
      target: null,
      cid: null,
      xScale: null,
      yScale: null,
      cssClass: null,
      color: 'steelBlue',
      inLegend: true,
      areaGenerator: d3.svg.area(),
      opacity: 1,
      hiddenStates: null
    };

    /**
     * Updates the area generator function
     */
    function updateAreaGenerator() {
      var dataConfig,
          y0,
          y1;

      dataConfig = area.data();
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      if (dataConfig.dimensions.y0) {
        // Use y0 for baseline if supplied.
        y0 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y0')(d, i));
        };
        y1 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i) +
            dataFns.dimension(dataConfig, 'y0')(d, i));
        };
      } else {
        // Otherwise default to bottom of range.
        y0 = function() {
          return config_.yScale.range()[0];
        };
        y1 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        };
      }

      // Configure the areaGenerator function
      config_.areaGenerator
        .x(function(d, i) {
          var value;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          return config_.xScale(value);
        })
        .y0(y0)
        .y1(y1)
        .defined(function(d, i) {
          var minX, value;
          minX = 0;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          if (config_.xScale) {
            minX = config_.xScale.range()[0];
            value = config_.xScale(value);
          }
          return value >= minX;
        });
    }

    /**
     * Main function for area component
     * @return {components.area}
     */
    function area() {
      obj.extend(config_, defaults_);
      return area;
    }

    // Apply mixins.
    obj.extend(
      area,
      config.mixin(
        config_,
        'cid',
        'target',
        'xScale',
        'yScale',
        'color',
        'opacity',
        'cssClass',
        'areaGenerator'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    area.dispatch = mixins.dispatch();

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    area.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return area;
      }
      return dataCollection_.get(config_.dataId);
    };

    /**
     * Updates the area component with new/updated data/config
     * @return {components.area}
     */
    area.update = function() {
      if (!root_) {
        return area;
      }

      updateAreaGenerator();

      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      root_.select('.gl-path')
        .datum(area.data().data)
        .attr({
          'fill': config_.color,
          'opacity': config_.opacity,
          'd': config_.areaGenerator
        });
      area.dispatch.update.call(this);
      return area;
    };

    /**
     * Renders the area component
     * @param  {d3.selection|Node|string} selection
     * @return {components.area}
     */
    area.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(area, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'area')
            });
          root.append('path')
            .attr({
              'class': string.classes('path'),
            });
          return root;
        });
      }
      area.update();
      area.dispatch.render.call(this);
      return area;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    area.root = function() {
      return root_;
    };

    /**
     * Destroys the area and removes everything from the DOM.
     */
    area.destroy = function() {
      if(root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      area.dispatch.destroy.call(this);
    };

    return area();

  };
});
