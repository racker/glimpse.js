/**
 * @fileOverview
 * Reusuable component for displaying annotations.
 */
define([
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'components/label'
],
function(configMixin, obj, string, d3util, mixins, label) {
  'use strict';

  return function() {

    var config = {},
      defaults,
      dataCollection,
      labelComponent,
      root;

    defaults = {
      type: 'annotation',
      target: null,
      components: [],
      cid: null,
      xScale: null,
      yScale: null,
      xPos: 0
    };

    /**
     * Updates the annotation component
     * @param  {d3.selection} selection
     */
    function update(selection) {
      selection
        //.datum(annotation.data().data)
        .attr({
          //'stroke-width': config.strokeWidth,
          //'stroke': config.color,
      });
    }

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
     * Main function for annotation component
     * @return {components.annotation}
     */
    function annotation() {
      obj.extend(config, defaults);
      return annotation;
    }

    obj.extend(
      annotation,
      configMixin.mixin(
        config,
        'cid',
        'xScale',
        'yScale',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    annotation.data = function(data) {
      if (data) {
        dataCollection = data;
      }
      return dataCollection;
    };

    /**
     * Updates the annotation component with new/updated data/config
     * @return {components.annotation}
     */
    annotation.update = function() {
      var dataConfig, xPos, alignRight;

      if (!root) {
        return annotation;
      }
      if (config.cid) {
        root.attr('gl-cid', config.cid);
      }
      labelComponent.root().select('text').attr({
        x: 6
      });
      xPos = config.xScale(config.xPos);
      //if (xPos >= config.xScale.range()[1]/2) {
        //alignRight = true;
      //}
      root.size(200, 1);
      root.attr({
        'transform': 'translate(' + xPos +', 0)'
      });


      root.select('.gl-annotation-line')
        .attr({
          stroke: '#000',
          opacity: 0.4,
          'stroke-width': 2,
          x1: 0,
          x2: 0,
          y1: config.yScale.range()[1],
          y2: config.yScale.range()[0]
        });

      //update(selection);
      //remove(selection);
      return annotation;
    };

    /**
     * Renders the annotation component
     * @param  {d3.selection|Node|string} selection
     * @return {components.annotation}
     */
    annotation.render = function(selection) {
      if (!root) {
        root = d3util.applyTarget(annotation, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'annotation')
            });
          root.append('line')
            .attr({
              'class': 'gl-annotation-line',
              'fill': 'none'
            });
          return root;
        });
        labelComponent = label()
          .config({
          })
          .text('test label')
          .render(root);
      }
      annotation.update();
      return annotation;
    };

    /**
     * Returns the root
     * @return {d3.selection}
     */
    annotation.root = function() {
      return root;
    };

    /**
     * Destroys the annotation and removes everything from the DOM.
     * @public
     */
    annotation.destroy = function() {
      if (root) {
        root.remove();
      }
      root = null;
      config = null;
      defaults = null;
    };

    return annotation();

  };
});
