/**
 * @fileOverview
 * Reusuable bar component.
 */
 define([
  'core/array',
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'core/function'
], function(array, config, obj, string, d3util, mixins, dataFns, fn) {
  'use strict';

  return function() {

    var _ = {
      config: {}
    };

    _.defaults = {
      type: 'bar',
      target: null,
      cid: null,
      color: null,
      xScale: null,
      yScale: null,
      inLegend: true,
      cssClass: null,
      height: null,
      width: null,
      barWidth: 20,
      scaleWidth: true,
      barPadding: 1,
      opacity: 1,
      rootId: null
    };

    /**
     * Main function for line component
     * @return {components.line}
     */
    function bar() {
      obj.extend(_.config, _.defaults);
      return bar;
    }

    bar._ = _;

    obj.extend(
      bar,
      config.mixin(
        _.config,
        'cid',
        'xScale',
        'yScale',
        'color',
        'cssClass',
        'rootId'
      ),
      mixins.component,
      mixins.highlight);

    bar.init();

    /**
    * Gets value of Y for a data object
    * Converts into UTC data for time series.
    * @param  {Object} data
    * @param  {number} index
    * @return {string|number}
    */
    function getY(data, index) {
      var y, dataConfig;
      dataConfig = bar.data();
      y = dataFns.dimension(
        dataConfig,
        'y'
      )(data, index);
      return y;
    }

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the scatter component
     * @param  {string} dataId
     */
    function handleDataToggle(args) {
      var id = _.config.dataId;
      if (args === id) {
        if (_.dataCollection.hasTags(id, 'inactive')) {
          bar.hide();
        } else {
          bar.show();
        }
      }
    }

    function update(selection, dataLength) {

      if (!_.config.width) {
        _.config.width = _.config.xScale.range()[1];
      }

      if (!_.config.height) {
        _.config.height = _.config.yScale.range()[0];
      }

      selection.attr({
        'class': 'gl-data-bar',
        'fill': _.config.color,
        'height': function (d, i) {
          return getY(d,i);
        },
        'width': _.config.scaleWidth ?
          _.config.width/ dataLength - _.config.barPadding : _.config.barWidth,
        'opacity': _.config.opacity,
        'x' : function (d, i) {
          return i * (_.config.width/dataLength);
        },
        'y': function (d, i) {
          return _.config.height - getY(d,i);
        }
      });
    }

    /**
     * Removes elements from the exit selection
     * @param  {d3.selection|Node|string} selection
     */
    function remove(selection) {
      if (selection && selection.exit) {
        selection.exit().remove();
      }
    }

    bar.data = function (data) {
      if (data) {
        _.dataCollection = data;
        return bar;
      }
      if (!_.dataCollection) {
        return;
      }
      return _.dataCollection.get(_.config.dataId);
    };

    /**
    * Updates the bar component with new/updated data/config
    * @return {components.bar}
    */
    bar.update = function() {
      var dataLength, dataConfig, selection;
      if (!_.root) {
        return bar;
      }
      dataConfig = bar.data();
      dataLength = bar.data().data.length;
      // Do not generate bar when there's no data.
      if (dataLength === 0) {
        return bar;
      }

      if (_.config.cssClass) {
        _.root.classed(_.config.cssClass, true);
      }

      selection = _.root.selectAll('.gl-data-bar')
        .data(bar.data().data);

      selection.enter()
        .append('rect');

      update(selection, dataLength);
      remove(selection);
      bar.emit('update');
      return bar;
    };

    /**
     * Renders the bar component
     * @param  {d3.selection|Node|string} selection
     * @return {components.bar}
     */
    bar.render = function(selection) {
      if(!_.root) {
        _.root = d3util.applyTarget(bar, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'bar')
           });
          return root;
        });
      }
      _.globalPubsub.sub(bar.globalScope('data-toggle'), handleDataToggle);
      bar.update();
      bar.emit('render');
      return bar;
    };

    /**
    * Returns the _.root
    * @return {d3.selection}
    */
    bar.root = function() {
      return _.root;
    };

    /**
    * Destroys the bar and removes everything from the DOM.
    */
    bar.destroy = fn.compose.call(bar, bar.destroy, function() {
      _.globalPubsub.unsub(
        bar.globalScope('data-toggle'), handleDataToggle);
      _.globalPubsub.sub(bar.scope('mouseout'), bar.handleMouseOut);
      _.globalPubsub.sub(bar.scope('mousemove'), bar.handleMouseMove);
    });

    return bar();

  };
});