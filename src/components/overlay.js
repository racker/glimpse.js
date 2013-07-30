/**
 * @fileOverview
 * An overlay component that fills an area, hides its contents, and displays
 * a series of other components which render to the specified layout.
 */
define([
  'core/object',
  'core/config',
  'core/string',
  'components/label',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, label, mixins, d3util) {
  'use strict';

  return function() {

    var _ = {
        config: {}
      },
      updateChildren_;

    _.config = {};

    _.defaults = {
      cid: null,
      target: null,
      components: [],
      layoutConfig: { type: 'horizontal', position: 'center', gap: 6 },
      opacity: 1,
      backgroundColor: '#fff',
      type: 'overlay',
      hiddenStates: null,
      rootId: null,
      zIndex: 20
    };

    /**
     * Append background rect, all child components, and apply the layout.
     * @private
     */
    updateChildren_ = function() {
      var parentNode,
          componentsContainer;

      parentNode = d3.select(_.root.node().parentNode);

      _.root.select('rect').attr({
        width: parentNode.width(),
        height: parentNode.height(),
        opacity: _.config.opacity,
        fill: _.config.backgroundColor
      });
      componentsContainer = _.root.select('g')
        .attr('class', 'gl-components');
      _.config.components.forEach(function(component) {
        if (component.root()) {
          // If already rendered, just update instead.
          component.update();
        } else {
          component.render(componentsContainer);
        }
      });
      componentsContainer.layout(_.config.layoutConfig);
    };

    function overlay() {
      obj.extend(_.config, _.defaults);
      return overlay;
    }
    overlay._ = _;

    // Apply Mixins
    obj.extend(
      overlay,
      config.mixin(
        _.config,
        'cssClass',
        'opacity',
        'backgroundColor',
        'layoutConfig'
      ),
      mixins.component);

    overlay.init();

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    overlay.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(overlay, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'overlay')
            });
          root.append('rect');
          root.append('g');
          return root;
        });
      }
      overlay.update();
      overlay.dispatch.render.call(this);
      return overlay;
    };

    /**
     * Triggers an update of the component reapplying all specified config
     * updates.
     * @public
     * @return {componnets.update}
     */
    overlay.update = function() {
      if (!_.root) {
        return overlay;
      }
      if (_.config.cssClass) {
        _.root.classed(_.config.cssClass, true);
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      updateChildren_();
      overlay.applyZIndex();
      overlay.dispatch.update.call(this);
      return overlay;
    };

    return overlay();

  };

});
