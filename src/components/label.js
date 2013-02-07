/**
 * @fileOverview
 * Component to render a single arbirtary text label.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'core/array',
  'd3-ext/util'
],
function(obj, config, string, array, util) {
  'use strict';

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      data_,
      root_;

    config_ = {};

    defaults_ = {
      cid: undefined,
      dataId: undefined,
      cssClass: undefined,
      text: undefined,
      gap: undefined,
      layout: 'horizontal',
      position: 'center-right',
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontSize: 13
    };

    // PUBLIC

    /**
     * The main function.
     * @return {components.label}
     */
    function label() {
      obj.extend(config_, defaults_);
      return label;
    }

    /**
     * @description Gets/Sets the data source to be used with the label.
     *    Uses the configurable "text" accessor function to retrieve text.
     * @param {Object} data Any data source.
     * @return {Object|components.label}
     */
    label.data = function(data) {
      // Set data if provided.
      if (data) {
        data_ = data;
        return label;
      }
      // Find corresponding data group if dataId is set.
      if (config_.dataId) {
        return array.find(data_, function(d) {
          return d.id === config_.dataId;
        });
      }
      // Otherwise return the entire raw data.
      return data_;
    };

    /**
     * @description Gets/sets the static text to display.
     *    Alternative to using data().
     * @param {string} text
     * @return {components.label|string}
     */
    label.text = function(text) {
      if (text) {
        config_.text = d3.functor(text);
        return label;
      }
      return d3.functor(config_.text)(label.data());
    };

    /**
     * @description Does the initial render to the document.
     * @param {d3.selection|Node|string} A d3.selection, DOM node,
     *    or a selector string.
     * @return {components.label}
     */
    label.render = function(selection) {
      root_ = util.select(selection).append('g');
      root_.append('text').style('dominant-baseline', 'hanging');
      label.update();
      return label;
    };

    /**
     * @description Triggers a document updated based on new data/config.
     * @return {components.label}
     */
    label.update = function() {
      var text;

      text = label.text();

      // Return early if no data or render() hasn't been called yet.
      if (!root_ || !text) {
        return;
      }

      root_.attr({
        'class': 'gl-component gl-label',
        'transform':
          'translate(' + [config_.marginLeft, config_.marginTop] + ')'
      });
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      root_.select('text').attr({
        'fill': config_.color,
        'font-family': config_.fontFamily,
        'font-size': config_.fontSize,
        'font-weight': config_.fontWeight
      })
      .text(text);
      root_.position(config_.position);
      return label;
    };


    // MIXINS

    obj.extend(
      label,
      config(label, config_, [
        'cid',
        'target',
        'cssClass',
        'color',
        'fontFamily',
        'fontSize',
        'fontWeight'
      ]));

    return label();
  };

});
