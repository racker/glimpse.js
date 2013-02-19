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
  'components/mixins'
],
function (array, config, obj, string, d3Util, mixins) {
  'use strict';

  return function () {

    //Private variables
    var config_ = {},
      defaults_,
      data_,
      root_,
      remove_,
      update_;

    defaults_ = {
      target: '.gl-framed',
      cid: undefined,
      strokeWidth: 2,
      color: 'steelBlue',
      showInLegend: true,
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
    update_ = function (selection) {
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
    remove_ = function (selection) {
      selection.exit().remove();
    };

    /**
     * Main function for line component
     * @return {components.line}
     */
    function line() {
      obj.extend(config_, defaults_);
      return line;
    }

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    line.data = function (data) {
      if (data) {
        data_ = data;
        return line;
      }
      return array.find(data_, function (d) {
        return d.id === config_.dataId;
      });
    };

    /**
     * Updates the line component with new/updated data/config
     * @return {components.line}
     */
    line.update = function () {
      var dataConfig, selection;
      dataConfig = line.data();

      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }

      // Configure the lineGenerator function
      config_.lineGenerator
        .x(function(d, i) {
          return config_.xScale(dataConfig.x(d, i));
        })
        .y(function(d, i) {
          return config_.yScale(dataConfig.y(d, i));
        })
        .defined(function (d, i) {
          var minX = config_.xScale.range()[0];
          return(config_.xScale(dataConfig.x(d, i)) >= minX);
        })
        .interpolate(config_.interpolate);

      selection = root_.select('.gl-path').data(dataConfig.data);

      update_(selection);
      remove_(selection);
      return line;
    };

    /**
     * Renders the line component
     * @param  {d3.selection|Node|string} selection
     * @return {components.line}
     */
    line.render = function (selection) {
      root_ = d3Util.select(selection).append('g')
        .attr({
          'class': 'gl-component gl-line'
        });
      root_.append('path')
        .attr({
          'class': 'gl-path',
          'fill': 'none'
        });
      line.update();

      return line;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    line.root = function () {
      return root_;
    };

    obj.extend(
      line,
      config.mixin(
        config_,
        'cid',
        'xScale',
        'yScale',
        'lineGenerator'
    ), mixins.toggle);

    return line();

  };
});
