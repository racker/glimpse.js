/**
 * @fileOverview
 * Area component to draw filled areas in 2d space.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/function',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions'
],
function(array, config, obj, fn, string, d3util, mixins, dataFns) {
  'use strict';

  return function() {

    //Private variables
    var _ = {
      config: {},
      isHighlighted: false
    };

    _.defaults = {
      type: 'area',
      target: null,
      cid: null,
      xScale: null,
      yScale: null,
      cssClass: null,
      color: null,
      inLegend: true,
      areaGenerator: d3.svg.area(),
      opacity: 1,
      hiddenStates: null,
      rootId: null,
      zIndex: 5,
      showHighlightTransition: false,
      highlightRadius: 4,
      highlightFill: '#fff',
      highlightStrokeWidth: 2,
      showHighlight: false
    };

    /**
     * Updates the area generator function
     */
    function updateAreaGenerator() {
      var dataConfig,
          y0,
          y1;

      dataConfig = area.data();
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      if (dataConfig.dimensions.y0) {
        // Use y0 for baseline if supplied.
        y0 = function(d, i) {
          return _.config.yScale(dataFns.dimension(dataConfig, 'y0')(d, i));
        };
        y1 = function(d, i) {
          return _.config.yScale(dataFns.dimension(dataConfig, 'y')(d, i) +
            dataFns.dimension(dataConfig, 'y0')(d, i));
        };
      } else {
        // Otherwise default to bottom of range.
        y0 = function() {
          return _.config.yScale.range()[0];
        };
        y1 = function(d, i) {
          return _.config.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        };
      }

      // Configure the areaGenerator function
      _.config.areaGenerator
        .x(function(d, i) {
          var value;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          return _.config.xScale(value);
        })
        .y0(y0)
        .y1(y1)
        .defined(function(d, i) {
          var minX, value;
          minX = 0;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          if (_.config.xScale) {
            minX = _.config.xScale.range()[0];
            value = _.config.xScale(value);
          }
          return value >= minX;
        });
    }

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the area component
     * @param  {string} dataId
     */
     //TODO: same as line so extract it out
     function handleDataToggle(args) {
      var id = _.config.dataId;
      if (args === id) {
        if (_.dataCollection.hasTags(id, 'inactive')) {
          area.hide();
        } else {
          area.show();
        }
      }
      area.update();
    }

    /**
     * Main function for area component
     * @return {components.area}
     */
    function area() {
      obj.extend(_.config, _.defaults);
      return area;
    }
    area._ = _;

    // Apply mixins.
    obj.extend(
      area,
      config.mixin(
        _.config,
        'xScale',
        'yScale',
        'color',
        'opacity',
        'cssClass',
        'areaGenerator'
      ),
      mixins.component,
      mixins.highlight);

    area.init();

    /**
     * Updates the area component with new/updated data/config
     * @return {components.area}
     */
    area.update = function() {
      var dataConfig;
      if (!_.root) {
        return area;
      }

      dataConfig = area.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return area;
      }

      updateAreaGenerator();
      area.initHighlight();

      if (_.config.cssClass) {
        _.root.classed(_.config.cssClass, true);
      }
      _.root.select('.gl-path')
        .datum(area.data().data)
        .attr({
          'fill': _.config.color,
          'opacity': _.config.opacity,
          'd': _.config.areaGenerator
        });
      area.applyZIndex();
      area.emit('update');
      return area;
    };

    /**
     * Renders the area component
     * @param  {d3.selection|Node|string} selection
     * @return {components.area}
     */
    //TODO: area.render is being called twice
    area.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(area, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'area')
            });
          root.append('path')
            .attr({
              'class': string.classes('path')
            });
          return root;
        });
      }
      _.globalPubsub.sub(area.globalScope('data-toggle'), handleDataToggle);
      area.update();
      area.emit('render');
      return area;
    };

    /**
     * Destroys the area and removes everything from the DOM.
     */
    area.destroy = fn.compose.call(area, area.destroy, function() {
      _.globalPubsub.unsub(area.globalScope('data-toggle'), handleDataToggle);
      _.globalPubsub.unsub(area.scope('mouseout'), area.handleMouseOut);
      _.globalPubsub.unsub(area.scope('mousemove'), area.handleMouseMove);
    });

    return area();

  };
});
