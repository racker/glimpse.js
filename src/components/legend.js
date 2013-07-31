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

    var _ = {
      defaults: {},
      config: {},
      root: null,
      enter: null,
      update: null,
      remove: null,
      dataCollection: null,
    },
      onClickHandler;


    _.defaults = {
      type: 'legend',
      position: 'center-left',
      target: null,
      cid: null,
      indicatorWidth: 10,
      indicatorHeight: 10,
      indicatorSpacing: 4,
      fontColor: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontSize: 13,
      layout: 'horizontal',
      inactiveColor: 'grey',
      gap: 20,
      keys: [],
      hiddenStates: ['loading'],
      rootId: null,
      hideOnClick: true,
      zIndex: 10
    };

    _.globalPubsub = pubsub.getSingleton();

    /**
     * Handles the click event on legend.
     */
    onClickHandler = function(d) {
      var sel = d3.select(this),
      inactive = _.config.inactiveColor,
      fontColor = _.config.fontColor;

      if (_.dataCollection.hasTags(d.dataId, 'inactive')) {
        sel.select('text').attr('fill', fontColor);
        sel.select('rect').attr('fill', d.color);
      } else {
        sel.select('text').attr('fill', inactive);
        sel.select('rect').attr('fill', inactive);
      }
      // toggles data's tag on the data collection
      _.dataCollection.toggleTags(d.dataId, 'inactive', _.config.rootId);
    };

    /**
     * Inserts new keys.
     * @param {d3.selection} selection
     */
    _.enter = function(selection) {
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
    _.update = function(selection) {
      var inactive, color;

      // Handle click event- toggle data inactive
      if(_.config.hideOnClick) {
        selection
          .on('click', onClickHandler);
      } else {
        selection
          .on('click', null);
      }

      // The outer <g> element for each key.
      selection
        .attr({
          'font-family': _.config.fontFamily,
          'font-size': _.config.fontSize,
          'font-weight': _.config.fontWeight
        });

      // Update key indicators.
      selection.selectAll('.gl-legend-key-indicator')
        .attr({
          'width': _.config.indicatorWidth,
          'height': _.config.indicatorHeight,
          'style': function() {
            return _.config.hideOnClick ? 'cursor: pointer;' : null;
          },
          'fill': function(d) {
            inactive = _.dataCollection.hasTags(d.dataId, 'inactive');
            color = inactive ? _.config.inactiveColor : d3.functor(d.color)();
            return color;
          }
        });

      // Update key text.
      selection.selectAll('.gl-legend-key-label')
        .text(function(d) { return d.label; })
        .attr({
          'x': _.config.indicatorWidth + _.config.indicatorSpacing,
          'y': _.config.indicatorHeight,
          'style': function() {
            return _.config.hideOnClick ? 'cursor: pointer;' : null;
          },
          'fill': function(d) {
            inactive = _.dataCollection.hasTags(d.dataId, 'inactive');
            color = inactive ? _.config.inactiveColor : _.config.fontColor;
            return color;
          }
        });
    };

    /**
     * Remove any keys that were removed.
     * @param {d3.selection} selection
     */
    _.remove = function(selection) {
      selection.exit().remove();
    };

    // PUBLIC

    /**
     * The main function.
     */
    function legend() {
      obj.extend(_.config, _.defaults);
      return legend;
    }

    legend._ = _;

    // Apply Mixins.
    obj.extend(
      legend,
      config.mixin(
        _.config,
        'cid',
        'keys',
        'fontColor',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'indicatorWidth',
        'indicatorHeight',
        'rootId',
        'zIndex'
      ),
      mixins.lifecycle,
      mixins.toggle,
      mixins.zIndex);

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
        _.dataCollection = data;
        return legend;
      }
      if (!_.dataCollection) {
        return null;
      }
      return _.dataCollection;
    };

    /**
     * Apply post-render updates.
     * Insert/update/remove DOM for each key.
     */
    legend.update = function() {
      var selection, dataConfig;

      // Return early if no data or render() hasn't been called yet.
      if (!_.config.keys || !_.root) {
        return legend;
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }

      dataConfig = legend.data();
      // Return early if there's no data.
      if (!dataConfig) {
        return legend;
      }

      // The selection of legend keys.
      selection = _.root
        .selectAll('.gl-legend-key')
        .data(_.config.keys, function(d) {
          return d.dataId;
        });
      _.remove(selection);
      _.enter(selection);
      _.update(selection);
      _.root.layout({type: _.config.layout, gap: _.config.gap});
      _.root.position(_.config.position);
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
      if (!_.root) {
        _.root = d3util.applyTarget(legend, selection, function(target) {
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
     * Destroys the legend and removes everything from the DOM.
     * @public
     */
    legend.destroy = function() {
      if (_.root) {
        _.root.remove();
      }
      _.root = null;
      _.config = null;
      _.defaults = null;
      legend.applyZIndex();
      legend.dispatch.destroy.call(this);
    };

    return legend();
  };

});
