/**
 * @fileOverview
 * Reusuable tooltip component.
 */
define([
  'core/array',
  'core/config',
  'core/object',
  'core/function',
  'core/string',
  'd3-ext/util',
  'mixins/mixins'
],
function(array, config, obj, fn, string, d3util, mixins) {
  'use strict';


  return function() {

    //Private variables
    var _ = {
      config: {}
    };

    _.defaults = {
      type: 'tooltip',
      message: '',
      visible: false,
      target: null,
      cid: null,
      color: null,
      opacity: 1,
      x: 100,
      y: 100,
      rootId: null,
      zIndex: 5,
      strokeColor:  '#4c9acc',
      fillColor: '#f0f4f7'
    };

    /**
     * Main function for tooltip component
     * @return {components.tooltip}
     */
    function tooltip() {
      obj.extend(_.config, _.defaults);
      return tooltip;
    }
    tooltip._ = _;

    obj.extend(
      tooltip,
      config.mixin(
        _.config,
        'color'
      ),
      mixins.component);

    tooltip.init();

    /**
     * Updates the tooltip component with new/updated data/config
     * @return {components.tooltip}
     */
    tooltip.update = function() {
      var i, childNodes,
          root = _.root,
          content,
          size,
          message = _.config.message,
          transform = d3.transform();
          transform.translate = [_.config.x, _.config.y];

      if (!_.root) {
        return tooltip;
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      root.select('.gl-tooltip-content').remove();
      content = root.append('g').attr('class', 'gl-tooltip-content');
      message.split('\n').forEach(function(line) {
        content.append('text')
          .style({
            'font-family': 'sans-serif',
            'font-size': '10px'
          })
          .text(line);
      });
      content.layout({ type: 'vertical' });
      // TODO: Modify layout command to take position and remove logic below.
      childNodes = content.node().childNodes;
      for (i = 0; i < childNodes.length; i++) {
        d3.select(childNodes[i]).attr('x', 0);
      }
      root.attr({
        'transform': transform.toString()
      });
      size = content.size();
      root.select('.gl-tooltip-bg').attr({
        width: size[0] * 1.2,
        height: size[1] * 1.2
      });
      content.center(0, 2);
      tooltip.applyZIndex();
      tooltip.emit('update');
      return tooltip;
    };

    /**
     * Renders the tooltip component
     * @param  {d3.selection|Node|string} selection
     * @return {components.tooltip}
     */
    tooltip.render = function(selection) {
      if (!_.root) {
        _.root = d3util.applyTarget(tooltip, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'tooltip')
            });
          root.append('rect')
            .attr({
              'class': 'gl-tooltip-bg',
              rx:3,
              ry:3,
            })
            .style({
              fill: _.config.fillColor,
              stroke: _.config.strokeColor,
              'stroke-width': '2px',
              opacity: 0.95
            });
          return root;
        });
      }
      _.globalPubsub.sub('tooltip-show', function(e, target, message) {
        var targetSel = d3.select(target),
            x = e.x,
            y = e.y,
            selWidth = targetSel.width(),
            selHeight = targetSel.height(),
            tooltipWidth = _.root.width(),
            tooltipHeight = _.root.height(),
            chartWidth = d3.select(target.parentNode).width(),
            chartHeight = d3.select(target.parentNode).height(),
            transform = d3.transform();
        _.config.message = message;
        tooltip.update();
        tooltip.show();
        if (x + selWidth + tooltipWidth < chartWidth) { // Right.
          transform.translate = [(x + selWidth),
            (y + (selHeight / 2) - (tooltipHeight / 2))];
        } else if (x - tooltipWidth > 0) { // Left
          transform.translate = [(x - tooltipWidth),
            (y + (selHeight/ 2) - (tooltipHeight / 2))];
        } else if (y + selHeight < chartHeight) { // Bottom
          transform.translate = [(x + (selWidth / 2) - tooltipWidth / 2),
            y + selHeight];
        } else { // Top
          transform.translate = [(x + (selWidth / 2) -  tooltipWidth / 2),
            (y - tooltipHeight)];
        }
        _.root.attr('transform', transform.toString());
      });
      _.globalPubsub.sub('tooltip-hide', function() {
        tooltip.hide();
      });

      tooltip.update();
      tooltip.emit('render');
      if (_.config.visible) {
        tooltip.show();
      } else {
        tooltip.hide();
      }
      return tooltip;
    };

    return tooltip();

  };
});
