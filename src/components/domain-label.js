/**
 * @fileOverview
 * Component to display the start/end values of a domain.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'core/format',
  'd3-ext/util',
  'components/mixins',
  'components/label'
],
function(obj, configMixin, string, format, d3util, mixins, label) {
  'use strict';

  return function() {

    // PRIVATE

    var defaults,
      config,
      root,
      dataCollection,
      innerLabel;

    config = {};

    defaults = {
      type: 'domainLabel',
      cid: null,
      target: null,
      cssClass: null,
      suffix: null,
      dataId: '$domain',
      layout: 'horizontal',
      position: 'center-right',
      formatter: format.timeDomainUTC,
      dimension: 'x',
      hiddenStates: ['loading']
    };

    // PUBLIC

    /**
     * The main function.
     * @return {components.domainLabel}
     */
    function domainLabel() {
      obj.extend(config, defaults);
      innerLabel = label();
      domainLabel.rebind(
        innerLabel,
        'color',
        'fontFamily',
        'fontWeight',
        'fontSize');
      return domainLabel;
    }

    // Apply Mixins
    obj.extend(
      domainLabel,
      configMixin.mixin(
        config,
        'cid',
        'target',
        'cssClass'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Gets/Sets the data source to be used with the domainLabel.
     * @param {Object} data Any data source.
     * @return {Object|components.domainLabel}
     */
    domainLabel.data = function(data) {
      // Set data if provided.
      if (data) {
        dataCollection = data;
        return domainLabel;
      }
      // Otherwise return the entire raw data.
      return dataCollection;
    };

    /**
     * Does the initial render to the document.
     * @param {d3.selection|Node|string} A d3.selection, DOM node,
     *    or a selector string.
     * @return {components.domainLabel}
     */
    domainLabel.render = function(selection) {
      if (!root) {
        root = d3util.applyTarget(domainLabel, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'domain-label')
            });
          return root;
        });
        if (root) {
          innerLabel.render(root);
        }
      }
      domainLabel.update();
      return domainLabel;
    };

    /**
     * Triggers a document update based on new data/config.
     * @return {components.domainLabel}
     */
    domainLabel.update = function() {
      // Return early if no data or render() hasn't been called yet.
      if (!root) {
        return domainLabel;
      }
      if (config.cssClass) {
        root.classed(config.cssClass, true);
      }
      if (config.cid) {
        root.attr('gl-cid', config.cid);
      }
      innerLabel
        .config('dataId', config.dataId)
        .data(dataCollection)
        .text(function(domainData) {
          return config.formatter(domainData[config.dimension], config.suffix);
        })
        .update();
      root.position(config.position);
      return domainLabel;
    };

    /**
     * Returns the formatted text.
     * @public
     * @return {String}
     */
    domainLabel.text = function() {
      return innerLabel.text();
    };

    /**
     * Returns the root
     * @return {d3.selection}
     */
    domainLabel.root = function () {
      return root;
    };

    /**
     * Destroys the domainLabel and removes everything from the DOM.
     * @public
     */
    domainLabel.destroy = function() {
      if (root) {
        root.remove();
      }
      root = null;
      config = null;
      defaults = null;
      innerLabel.destroy();
    };

    return domainLabel();
  };

});
