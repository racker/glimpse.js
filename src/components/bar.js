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
  'data/functions'
], function(array, config, obj, string, d3util, mixins, dataFns) {
  'use strict';

  return function() {

    var config_ = {},
      defaults_,
      dataCollection_,
      root_;

    defaults_ = {
      type: 'bar',
      target: null,
      cid: null,
      color: null,
      xScale: null,
      yScale: null,
      height: '141.12',
      width: '698',
      barPadding: 1,
      opacity: 1,
      rootId: null
    };

    /**
     * Main function for line component
     * @return {components.line}
     */
    function bar() {
      obj.extend(config_, defaults_);
      return bar;
    }

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

    obj.extend(
      bar,
      config.mixin(
	config_,
	'cid',
	'xScale',
	'yScale',
	'color',
	'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
    * Event dispatcher.
    * @public
    */
    bar.dispatch = mixins.dispatch();

    bar.data = function (data) {
      if (data) {
	dataCollection_ = data;
	return bar;
      }
      if (!dataCollection_) {
	return;
      }
      return dataCollection_.get(config_.dataId);
    };

    /**
    * Updates the bar component with new/updated data/config
    * @return {components.bar}
    */
    bar.update = function() {
      var dataLength, dataConfig;
      if (!root_) {
	return bar;
      }
      dataConfig = bar.data();
      dataLength = bar.data().data.length;
      // Do not generate bar when there's no data.
      if (dataLength === 0) {
	return bar;
      }

      root_.selectAll('.gl-rect')
	.data(bar.data().data)
	.enter()
	.append('rect')
	.attr({
	  'fill': config_.color,
	  'height': function (d, i) {
	    return getY(d,i);
	  },
	  'width': config_.width/ dataLength - config_.barPadding,
	  'opacity': config_.opacity,
	  'x' : function (d, i) {
	    return i * (config_.width/dataLength);
	  },
	  'y': function (d, i) {
	    return config_.height - getY(d,i);
	  }
	});
      bar.dispatch.update.call(this);
      return bar;
    };

    /**
     * Renders the bar component
     * @param  {d3.selection|Node|string} selection
     * @return {components.bar}
     */
    bar.render = function(selection) {
      if(!root_) {
	root_ = d3util.applyTarget(bar, selection, function(target) {
	  var root = target.append('g')
	    .attr({
	      'class': string.classes('component', 'bar')
	    });
	  return root;
	});
      }
      bar.update();
      bar.dispatch.render.call(this);
      return bar;
    };

    /**
    * Returns the root_
    * @return {d3.selection}
    */
    bar.root = function() {
      return root_;
    };

    /**
    * Destroys the bar and removes everything from the DOM.
    */
    bar.destroy = function() {
      if(root_) {
	root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      bar.dispatch.destroy.call(this);
    };

    return bar();

  };
});