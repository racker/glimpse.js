/**
 * @fileOverview
 * Component to render a single arbirtary text label.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'core/array',
  'd3-ext/util',
  'components/mixins'
],
function(obj, config, string, array, d3util, mixins) {
  'use strict';

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      dataCollection_,
      root_;

    config_ = {};

    defaults_ = {
      type: 'label',
      cid: null,
      target: null,
      dataId: null,
      cssClass: null,
      text: null,
      gap: null,
      layout: 'horizontal',
      position: 'center-right',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontSize: 13,
      hiddenStates: null
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

    // Apply Mixins
    obj.extend(
      label,
      config.mixin(
        config_,
        'cid',
        'target',
        'cssClass',
        'color',
        'fontFamily',
        'fontSize',
        'fontWeight'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Gets/Sets the data source to be used with the label.
     * Uses the configurable "text" accessor function to retrieve text.
     * @param {Object} data Any data source.
     * @return {Object|components.label}
     */
    label.data = function(data) {
      // Set data if provided.
      if (data) {
        dataCollection_ = data;
        return label;
      }
      // Find corresponding data group if dataId is set.
      if (dataCollection_ && config_.dataId) {
        return dataCollection_.get(config_.dataId);
      }
      // Otherwise return the entire raw data.
      return dataCollection_;
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
      if (!root_) {
        root_ = d3util.applyTarget(label, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'label')
            });
          // With  xml:space = preserve setting, SVG will simply convert all
          // newline and tab characters to blanks, and then display the result,
          // including leading and trailing blanks. the same text.
          root.append('text')
            .attr('xml:space', 'preserve');
          return root;
        });
      }
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
        return label;
      }
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
        'font-weight': config_.fontWeight,
        // NOTE: Need to manually set y position since dominant-baseline
        //   doesn't work in FF or IE.
        'y': config_.fontSize
      })
      .text(text);
      root_.position(config_.position);
      return label;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    label.root = function () {
      return root_;
    };

    /**
     * Destroys the label and removes everything from the DOM.
     * @public
     */
    label.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
    };

    return label();
  };

});
