/**
 * @fileOverview
 * A Legend component that displays keys containing color indicators and the
 * label text of data.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'd3-ext/util'
],
function(obj, config, string, util) {
  'use strict';

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      root_,
      enter_,
      update_,
      remove_;

    config_ = {};

    defaults_ = {
      id: string.random(),
      position: 'center-left',
      target: '.gl-info',
      indicatorWidth: 10,
      indicatorHeight: 10,
      indicatorSpacing: 4,
      fontColor: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fontSize: 13,
      keySpacing: 20,
      marginTop: 10,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 10,
      layout: 'horizontal',
      gap: 10,
      keys: []
    };

    /**
     * Inserts new keys.
     * @param {d3.selection} selection
     */
    enter_ = function(selection) {
      var enterSelection;

      enterSelection = selection
        .enter()
          .append('g')
          .attr({
            'class': 'gl-legend-key'
          });

      // Add new key indicator.
      enterSelection
        .append('rect')
        .attr({
          'class': 'gl-legend-key-indicator',
          'stroke': 'none',
          'x': 0,
          'y': 0
        });

      // Add new key text.
      enterSelection
        .append('text')
        .attr({
          'class': 'gl-legend-key-label',
          'text-anchor': 'start',
          'stroke': 'none'
        });
    };

    /**
     * Apply updates to the update selection.
     * @param {d3.selection} selection
     */
    update_ = function(selection) {
      // The outer <g> element for each key.
      selection
        .attr({
          'class': 'gl-legend-key',
          'font-family': config_.fontFamily,
          'font-size': config_.fontSize,
          'font-weight': config_.fontWeight
        });

      // Update key indicators.
      selection.selectAll('.gl-legend-key-indicator')
        .attr({
          'width': config_.indicatorWidth,
          'height': config_.indicatorHeight,
          'fill': function(d) { return d.color; }
        });

      // Update key text.
      selection.selectAll('.gl-legend-key-label')
        .text(function(d) { return d.label; })
        .attr({
          'x': config_.indicatorWidth + config_.indicatorSpacing,
          'y': config_.indicatorHeight,
          'fill': config_.fontColor
        });
    };

    /**
     * Remove any keys that were removed.
     * @param {d3.selection} selection
     */
    remove_ = function(selection) {
      selection.exit().remove();
    };

    // PUBLIC

    /**
     * The main function.
     */
    function legend() {
      obj.extend(config_, defaults_);
      return legend;
    }

    /**
     * Apply post-render updates.
     * Insert/update/remove DOM for each key.
     */
    legend.update = function() {
      var selection;

      // Return early if no data or render() hasn't been called yet.
      if (!config_.keys || !root_) {
        return;
      }

      root_.attr({
        'class': 'gl-component gl-legend',
        'id': config_.id
      });

      // The selection of legend keys.
      selection = root_
        .selectAll('.gl-legend-key')
        .data(config_.keys, function(d) { return d.color; });

      remove_(selection);
      enter_(selection);
      update_(selection);
      root_.layout({type: config_.layout, gap: config_.gap});
      root_.position(config_.position);
      return legend;
    };

    /**
     * Render the legend to the selection.
     * Sets up initial DOM structure. Should only be called once.
     * @param {d3.selection|String} selection A d3 selection
     *    or a selector string.
     */
    legend.render = function(selection) {
      root_ = util.select(selection).append('g');
      legend.update();
      return legend;
    };

    // MIXINS
    obj.extend(
      legend,
      config(legend, config_, [
        'id',
        'keys',
        'fontColor',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'indicatorWidth',
        'indicatorHeight'
      ]));

    return legend();
  };

});
