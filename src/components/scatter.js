/**
 * @fileOverview
 * Reusuable scatter-plot component.
 */
define([
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'events/pubsub'
],
function(configMixin, obj, string, d3util, mixins, dataFns, pubsub) {
  'use strict';

  return function() {

    var config = {},
      defaults,
      dataCollection,
      root,
      globalPubsub = pubsub.getSingleton();

    defaults = {
      type: 'scatter',
      target: null,
      cid: null,
      color: '#333',
      strokeWidth: 1.5,
      radius: 6,
      inLegend: true,
      xScale: null,
      yScale: null,
      opacity: 0.4,
      hiddenStates: null,
      rootId: null
    };

    /**
     * Removes elements from the exit selection
     * @param  {d3.selection|Node|string} selection
     */
    function remove(selection) {
      if (selection && selection.exit) {
        selection.exit().remove();
      }
    }

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the scatter component
     * @param  {string} dataId
     */
     function handleDataToggle(args) {
      var id = config.dataId;
      if (args === id) {
        if (dataCollection.hasTags(id, 'inactive')) {
          scatter.hide();
        } else {
          scatter.show();
        }
      }
    }

    /**
     * Updates the scatter component
     * @param  {d3.selection} selection
     */
    function update(selection) {
      var dataConfig;
      dataConfig = scatter.data();
      selection
        .attr({
          cx: function(d, i) {
            return config.xScale(dataFns.dimension(dataConfig, 'x')(d, i));
          },
          cy: function(d, i) {
            return config.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
          },
          r: function(d, i) {
            var radiusDim;
            radiusDim = dataFns.dimension(dataConfig, 'r')(d, i);
            if (radiusDim !== null) {
              return radiusDim;
            }
            return config.radius;
          },
          fill: function(d, i) {
            var colorDim;
            colorDim = dataFns.dimension(dataConfig, 'color')(d, i);
            if (colorDim !== null) {
              return colorDim;
            }
            return config.color;
          },
          opacity: config.opacity,
          'class': string.classes('scatter-point')
        });
    }

    /**
     * Main function for scatter component
     * @return {components.scatter}
     */
    function scatter() {
      obj.extend(config, defaults);
      return scatter;
    }

    obj.extend(
      scatter,
      configMixin.mixin(
        config,
        'cid',
        'xScale',
        'yScale',
        'color',
        'opacity',
        'radius',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    scatter.dispatch = mixins.dispatch();

    // TODO: this will be the same for all components
    // put this func somewhere else and apply as needed
    scatter.data = function(data) {
      if (data) {
        dataCollection = data;
        return scatter;
      }
      if (!dataCollection) {
        return;
      }
      return dataCollection.get(config.dataId);
    };

    /**
     * Updates the scatter component with new/updated data/config
     * @return {components.scatter}
     */
    scatter.update = function() {
      var dataConfig, selection;

      if (!root) {
        return scatter;
      }
      if (config.cid) {
        root.attr('gl-cid', config.cid);
      }
      dataConfig = scatter.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return scatter;
      }

      selection = root.selectAll('.gl-scatter-point')
        .data(dataConfig.data);

      selection
        .enter()
        .append('circle');

      update(selection);
      remove(selection);
      scatter.dispatch.update.call(this);
      return scatter;
    };

    /**
     * Renders the scatter component
     * @param  {d3.selection|Node|string} selection
     * @return {components.scatter}
     */
    scatter.render = function(selection) {
      var scope;
      if (!root) {
        root = d3util.applyTarget(scatter, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'scatter')
            });
          return root;
        });
      }
      scope = scatter.scope();
      globalPubsub.sub(scope('data-toggle'), handleDataToggle);
      scatter.update();
      scatter.dispatch.render.call(this);
      return scatter;
    };

    /**
     * Returns the root
     * @return {d3.selection}
     */
    scatter.root = function() {
      return root;
    };

    /** Defines the rootId for scatter */
    //TODO create a mixin for scope
    scatter.scope = function() {
      return pubsub.scope(config.rootId);
    };

    /**
     * Destroys the scatter and removes everything from the DOM.
     * @public
     */
    scatter.destroy = function() {
      var scope;

      if (root) {
        root.remove();
      }
      scope = scatter.scope();
      globalPubsub.unsub(scope('data-toggle'), handleDataToggle);
      root = null;
      config = null;
      defaults = null;
      scatter.dispatch.destroy.call(this);
    };

    return scatter();

  };
});
