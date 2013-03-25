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
  'components/mixins',
  'd3-ext/util'
],
function(obj, config, string, label, mixins, d3util) {
  'use strict';

  return function() {

    var defaults_,
      config_,
      root_,
      updateChildren_;

    config_ = {};

    defaults_ = {
      cid: null,
      target: null,
      components: [],
      layoutConfig: { type: 'horizontal', position: 'center', gap: 6 },
      opacity: 1,
      backgroundColor: '#fff',
      type: 'overlay'
    };

    /**
     * Append background rect, all child components, and apply the layout.
     * @private
     */
    updateChildren_ = function() {
      var parentNode,
          componentsContainer;

      parentNode = d3.select(root_.node().parentNode);

      root_.select('rect').attr({
        width: parentNode.width(),
        height: parentNode.height(),
        opacity: config_.opacity,
        fill: config_.backgroundColor
      });
      componentsContainer = root_.select('g')
        .attr('class', 'gl-components');
      config_.components.forEach(function(component) {
        if (component.root()) {
          // If already rendered, just update instead.
          component.update();
        } else {
          component.render(componentsContainer);
        }
      });
      componentsContainer.layout(config_.layoutConfig);
    };

    function overlay() {
      obj.extend(config_, defaults_);
      return overlay;
    }

    // Apply Mixins
    obj.extend(
      overlay,
      config.mixin(
        config_,
        'cid',
        'target',
        'cssClass',
        'opacity',
        'backgroundColor',
        'layoutConfig'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /*
     * Gets the root selection of this component.
     * @public
     * @return {d3.selection}
     */
    overlay.root = function () {
      return root_;
    };

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    overlay.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(overlay, selection, function(target) {
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
      return overlay;
    };

    /**
     * Triggers an update of the component reapplying all specified config
     * updates.
     * @public
     * @return {componnets.update}
     */
    overlay.update = function() {
      if (!root_) {
        return overlay;
      }
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      updateChildren_();
      return overlay;
    };

    /**
     * Destroys this component and cleans up after itself.
     * @public
     */
    overlay.destroy = function() {
      // TODO: Need a more generalized way of removing sub-components.
      config_.components.forEach(function(label) {
        label.destroy();
      });
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
    };

    return overlay();

  };

});
