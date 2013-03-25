/**
 * @fileOverview
 * Reusuable line component.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'components/mixins',
  'data/functions'
],
function(array, config, obj, string, d3util, mixins, dataFns) {
  'use strict';

  return function() {

    //Private variables
    var config_ = {},
      defaults_,
      dataCollection_,
      root_,
      remove_,
      update_;

    defaults_ = {
      type: 'line',
      target: '.gl-framed',
      cid: undefined,
      strokeWidth: 2,
      color: undefined,
      inLegend: true,
      lineGenerator: d3.svg.line(),
      interpolate: 'linear',
      ease: 'linear',
      duration: 500,
      opacity: 1
    };

    /**
     * Updates the line component
     * @param  {d3.selection} selection
     */
    update_ = function(selection) {
      selection
        .datum(line.data().data)
        .attr({
          'stroke-width': config_.strokeWidth,
          'stroke': config_.color,
          'opacity': config_.opacity,
          'd': config_.lineGenerator
      });
    };

    /**
     * Removes elements from the exit selection
     * @param  {d3.selection|Node|string} selection
     */
    remove_ = function(selection) {
      if (selection && selection.exit) {
        selection.exit().remove();
      }
    };

    /**
     * Main function for line component
     * @return {components.line}
     */
    function line() {
      obj.extend(config_, defaults_);
      return line;
    }

    obj.extend(
      line,
      config.mixin(
        config_,
        'cid',
        'xScale',
        'yScale',
        'lineGenerator',
        'color'
      ),
      mixins.lifecycle,
      mixins.toggle);

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    line.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return line;
      }
      if (!dataCollection_) {
        return;
      }
      return dataCollection_.get(config_.dataId);
    };

    /**
     * Updates the line component with new/updated data/config
     * @return {components.line}
     */
    line.update = function() {
      var dataConfig, selection;

      if (!root_) {
        return line;
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      dataConfig = line.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return line;
      }
      // Configure the lineGenerator function
      config_.lineGenerator
        .x(function(d, i) {
          return config_.xScale(dataFns.dimension(dataConfig, 'x')(d, i));
        })
        .y(function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        })
        .defined(function(d, i) {
          var minX = config_.xScale.range()[0];
          return (config_.xScale(
            dataFns.dimension(dataConfig, 'x')(d, i)) >= minX);
        })
        .interpolate(config_.interpolate);
      selection = root_.select('.gl-path')
        .data(dataConfig.data);
      update_(selection);
      remove_(selection);
      return line;
    };

    /**
     * Renders the line component
     * @param  {d3.selection|Node|string} selection
     * @return {components.line}
     */
    line.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(line, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'line')
            });
          root.append('path')
            .attr({
              'class': 'gl-path',
              'fill': 'none'
            });
          return root;
        });
      }
      line.update();
      return line;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    line.root = function() {
      return root_;
    };

    /**
     * Destroys the line and removes everything from the DOM.
     * @public
     */
    line.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
    };

    return line();

  };
});
