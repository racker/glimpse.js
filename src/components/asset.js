/**
 * @fileOverview
 * A simple component to render out an asset.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, mixins, d3util) {
  'use strict';

  return function() {

    var _ = {
      config: {}
    };

    _.defaults = {
      cid: null,
      assetId: null,
      target: null,
      cssClass: null,
      hiddenStates: null,
      rootId: null,
      zIndex: 10
    };

    function asset() {
      obj.extend(_.config, _.defaults);
      return asset;
    }

    asset._ = _;

    // Apply Mixins
    obj.extend(
      asset,
      config.mixin(
        _.config,
        'assetId',
        'cssClass'
      ),
      mixins.component);

    asset.init();

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    asset.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(asset, selection, function(target) {
          return target.append('g')
            .attr({
              'class': string.classes('component', 'asset')
            });
        });
      }
      asset.update();
      asset.emit('render');
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

      if (!_.root) {
        return asset;
      }
      if (_.config.cssClass) {
        _.root.classed(_.config.cssClass, true);
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      useEl = _.root.select('use');
      if (useEl.empty()) {
        useEl = _.root.append('use');
      }
      useEl.attr({
        'class': _.config.assetId,
        'xlink:href': '#' + _.config.assetId
      });
      _.root.position(_.config.position);
      asset.applyZIndex();
      asset.emit('update');
      return asset;
    };

    return asset();

  };

});
