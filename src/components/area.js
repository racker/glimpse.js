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
  'components/mixins'
],
function(array, config, obj, string, d3util, mixins) {
  'use strict';

  return function() {

    //Private variables
    var config_ = {},
      defaults_,
      data_,
      root_,
      updateAreaGenerator_;

    defaults_ = {
      target: '.gl-framed',
      cid: null,
      xScale: null,
      yScale: null,
      cssClass: null,
      color: 'steelBlue',
      inLegend: true,
      areaGenerator: d3.svg.area(),
      opacity: 1
    };

    updateAreaGenerator_ = function() {
      var dataConfig,
          y0,
          y1;

      dataConfig = area.data();
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      if (dataConfig.y0) {
        // Use y0 for baseline if supplied.
        y0 = function(d, i) {
          return config_.yScale(dataConfig.y0(d, i));
        };
        y1 = function(d, i) {
          return config_.yScale(dataConfig.y(d, i) + dataConfig.y0(d, i));
        };
      } else {
        // Otherwise default to bottom of range.
        y0 = function() {
          return config_.yScale.range()[0];
        };
        y1 = function(d, i) {
          return config_.yScale(dataConfig.y(d, i));
        };
      }

      // Configure the areaGenerator function
      config_.areaGenerator
        .x(function(d, i) {
          return config_.xScale(dataConfig.x(d, i));
        })
        .y0(y0)
        .y1(y1)
        .defined(function(d, i) {
          var minX, value;
          minX = 0;
          value = dataConfig.x(d, i);
          if (config_.xScale) {
            minX = config_.xScale.range()[0];
            value = config_.xScale(value);
          }
          return value >= minX;
        });
    };

    /**
     * Main function for area component
     * @return {components.area}
     */
    function area() {
      obj.extend(config_, defaults_);
      return area;
    }

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    area.data = function(data) {
      if (data) {
        data_ = data;
        return area;
      }
      return array.find(data_, function(d) {
        return d.id === config_.dataId;
      });
    };

    /**
     * Updates the area component with new/updated data/config
     * @return {components.area}
     */
    area.update = function() {
      updateAreaGenerator_();
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
      return area;
    };

    /**
     * Renders the area component
     * @param  {d3.selection|Node|string} selection
     * @return {components.area}
     */
    area.render = function(selection) {
      root_ = d3util.select(selection || config_.target).append('g')
        .attr({
          'class': 'gl-component gl-area'
        });
      root_.append('path')
        .attr({
          'class': 'gl-path',
        });
      area.update();
      return area;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    area.root = function() {
      return root_;
    };

    area.destroy = function() {
      root_.remove();
      root_ = null;
      config_ = null;
      defaults_ = null;
    };

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
    ), mixins.toggle);

    return area();

  };
});