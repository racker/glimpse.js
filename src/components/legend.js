/**
 * @fileOverview
 * A Legend component that displays keys containing color indicators and the
 * label text of data.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'core/array',
  'd3-ext/util',
  'mixins/mixins',
  'events/pubsub'
],
function(obj, config, string, array, d3util, mixins, pubsub) {
  'use strict';

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      root_,
      enter_,
      update_,
      remove_,
      dataCollection_,
      onClickHandler,
      globalPubsub;


    config_ = {};

    defaults_ = {
      type: 'legend',
      position: 'center-left',
      target: null,
      cid: null,
      indicatorWidth: 10,
      indicatorHeight: 10,
      indicatorSpacing: 4,
      fontColor: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fontSize: 13,
      layout: 'horizontal',
      inactiveColor: 'grey',
      gap: 20,
      keys: [],
      hiddenStates: ['loading'],
      rootId: null,
      hideOnClick: true
    };

    globalPubsub = pubsub.getSingleton();

    /**
     * Handles the click event on legend.
     */
    onClickHandler = function(d) {
      var sel = d3.select(this),
      inactive = config_.inactiveColor,
      fontColor = config_.fontColor;

      if (dataCollection_.hasTags(d.dataId, 'inactive')) {
        sel.select('text').attr('fill', fontColor);
        sel.select('rect').attr('fill', d.color);
      } else {
        sel.select('text').attr('fill', inactive);
        sel.select('rect').attr('fill', inactive);
      }
      // toggles data's tag on the data collection
      dataCollection_.toggleTags(d.dataId, 'inactive', config_.rootId);
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
            'class': 'gl-legend-key',
            'gl-dataId': function(d) { return d.dataId; }
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
      var inactive, color;

      // Handle click event- toggle data inactive
      if(config_.hideOnClick) {
        selection
          .on('click', onClickHandler);
      } else {
        selection
          .on('click', null);
      }

      // The outer <g> element for each key.
      selection
        .attr({
          'font-family': config_.fontFamily,
          'font-size': config_.fontSize,
          'font-weight': config_.fontWeight
        });

      // Update key indicators.
      selection.selectAll('.gl-legend-key-indicator')
        .attr({
          'width': config_.indicatorWidth,
          'height': config_.indicatorHeight,
          'style': function() {
            return config_.hideOnClick ? 'cursor: pointer;' : null;
          },
          'fill': function(d) {
            inactive = dataCollection_.hasTags(d.dataId, 'inactive');
            color = inactive ? config_.inactiveColor : d3.functor(d.color)();
            return color;
          }
        });

      // Update key text.
      selection.selectAll('.gl-legend-key-label')
        .text(function(d) { return d.label; })
        .attr({
          'x': config_.indicatorWidth + config_.indicatorSpacing,
          'y': config_.indicatorHeight,
          'style': function() {
            return config_.hideOnClick ? 'cursor: pointer;' : null;
          },
          'fill': function(d) {
            inactive = dataCollection_.hasTags(d.dataId, 'inactive');
            color = inactive ? config_.inactiveColor : config_.fontColor;
            return color;
          }
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

    // Apply Mixins.
    obj.extend(
      legend,
      config.mixin(
        config_,
        'cid',
        'keys',
        'fontColor',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'indicatorWidth',
        'indicatorHeight',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    legend.dispatch = mixins.dispatch();


    /**
     * Gets/Sets the data to be used with the legend.
     * @param {Object} data Any data source.
     * @return {Object|dataCollection}
     */
    legend.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return legend;
      }
      if (!dataCollection_) {
        return null;
      }
      return dataCollection_;
    };

    /**
     * Apply post-render updates.
     * Insert/update/remove DOM for each key.
     */
    legend.update = function() {
      var selection, dataConfig;

      // Return early if no data or render() hasn't been called yet.
      if (!config_.keys || !root_) {
        return legend;
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }

      dataConfig = legend.data();
      // Return early if there's no data.
      if (!dataConfig) {
        return legend;
      }

      // The selection of legend keys.
      selection = root_
        .selectAll('.gl-legend-key')
        .data(config_.keys, function(d) {
          return d.dataId;
        });
      remove_(selection);
      enter_(selection);
      update_(selection);
      root_.layout({type: config_.layout, gap: config_.gap});
      root_.position(config_.position);
      legend.dispatch.update.call(this);
      return legend;
    };

    /**
     * Render the legend to the selection.
     * Sets up initial DOM structure. Should only be called once.
     * @param {d3.selection|String} selection A d3 selection
     *    or a selector string.
     */
    legend.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(legend, selection, function(target) {
          return target.append('g')
            .attr({
              'class': string.classes('component', 'legend')
            });
        });
      }
      legend.update();
      legend.dispatch.render.call(this);
      return legend;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    legend.root = function () {
      return root_;
    };

    /**
     * Destroys the legend and removes everything from the DOM.
     * @public
     */
    legend.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      legend.dispatch.destroy.call(this);
    };

    return legend();
  };

});
