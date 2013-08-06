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
  'mixins/mixins'
],
function(obj, config, string, array, d3util, mixins) {
  'use strict';

  return function() {

    // PRIVATE

    var _ = {
      config: {}
    };

    _.defaults = {
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
      hiddenStates: null,
      rootId: null,
      zIndex: 10
    };

    // PUBLIC

    /**
     * The main function.
     * @return {components.label}
     */
    function label() {
      obj.extend(_.config, _.defaults);
      return label;
    }

    label._ = _;

    // Apply Mixins
    obj.extend(
      label,
      config.mixin(
        _.config,
        'cssClass',
        'color',
        'fontFamily',
        'fontSize',
        'fontWeight'
      ),
      mixins.component);

    label.init();

    /**
     * @description Gets/sets the static text to display.
     *    Alternative to using data().
     * @param {string} text
     * @return {components.label|string}
     */
    label.text = function(text) {
      if (text) {
        _.config.text = d3.functor(text);
        return label;
      }
      return d3.functor(_.config.text).call(this);
    };

    /**
     * @description Does the initial render to the document.
     * @param {d3.selection|Node|string} A d3.selection, DOM node,
     *    or a selector string.
     * @return {components.label}
     */
    label.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(label, selection, function(target) {
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
      label.emit('render');
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
      if (!_.root || !text) {
        return label;
      }
      if (_.config.cssClass) {
        _.root.classed(_.config.cssClass, true);
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      _.root.select('text').attr({
        'fill': _.config.color,
        'font-family': _.config.fontFamily,
        'font-size': _.config.fontSize,
        'font-weight': _.config.fontWeight,
        // NOTE: Need to manually set y position since dominant-baseline
        //   doesn't work in FF or IE.
        'y': _.config.fontSize
      })
      .text(text);
      _.root.position(_.config.position);
      label.emit('update');
      return label;
    };

    return label();
  };

});
