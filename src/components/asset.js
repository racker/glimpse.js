/**
 * @fileOverview
 * A simple component to render out an asset.
 */
define([
  'core/object',
  'core/config',
  'components/mixins',
  'd3-ext/util'
],
function(obj, config, mixins, d3util) {
  'use strict';

  return function() {

    var defaults_,
      config_,
      root_;

    config_ = {};

    defaults_ = {
      cid: null,
      assetId: null,
      target: null,
      cssClass: null
    };

    function asset() {
      obj.extend(config_, defaults_);
      return asset;
    }

    // Apply Mixins
    obj.extend(
      asset,
      config.mixin(
        config_,
        'cid',
        'assetId',
        'target',
        'cssClass'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /*
     * Gets the root selection of this component.
     * @public
     * @return {d3.selection}
     */
    asset.root = function() {
      return root_;
    };

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    asset.render = function(selection) {
      if (!root_) {
        root_ = d3util.select(selection || config_.target).append('g');
        asset.update();
      }
      return asset;
    };

    /**
     * Triggers an update of the component reapplying all specified config
     * updates.
     * @public
     * @return {componnets.update}
     */
    asset.update = function() {
      var useEl;

      if (!root_) {
        return asset;
      }
      root_.attr({
        'class': 'gl-component gl-asset'
      });
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      useEl = root_.select('use');
      if (useEl.empty()) {
        useEl = root_.append('use');
      }
      useEl.attr({
        'class': config_.assetId,
        'xlink:href': '#' + config_.assetId
      });
      root_.position(config_.position);
      return asset;
    };

    /**
     * Destroys this component and cleans up after itself.
     * @public
     */
    asset.destroy = function() {
      if(root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
    };

    return asset();

  };

});
