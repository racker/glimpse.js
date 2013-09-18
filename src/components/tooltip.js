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
      opacity: 0.95,
      x: 100,
      y: 100,
      rootId: null,
      zIndex: 50,
      strokeColor:  '#4c9acc',
      fillColor: '#f0f4f7',
      padding: 10,
      hiddenStates: ['empty', 'loading', 'error']
    };

    /**
     * Displays tooltip
     * @param  {Object} data
     * @param  {Element} target
     * @param  {String} message Content to be displayed in
     *   tooltip
     */
    function displayTooltip(data, target, message) {
      var targetSel = d3.select(target),
          x = data.x,
          y = data.y,
          selWidth = targetSel.width(),
          selHeight = targetSel.height(),
          tooltipWidth = _.root.width(),
          tooltipHeight = _.root.height(),
          chartWidth = d3.select(target.parentNode).width(),
          chartHeight = d3.select(target.parentNode).height(),
          transform = d3.transform();

      _.config.message = message;
      tooltip.update();

      //TODO: Fix calculations for line/area components (bottom)
      //TODO: Resolve the flicker issue with line/area toolttips
      //TODO: Show tooltips for scatter plot with diff radius.
      //TODO: Math.round for x and y
      //TODO: Pending tests
      //Make calculations readable
      //Config setting for tooltip

      //Tooltip on Right.
      if (x + selWidth + tooltipWidth < chartWidth &&
        y - tooltipHeight / 3 > 0 &&
        y + tooltipHeight / 3 < chartHeight) {
          transform.translate =
            [(x + selWidth * 2), (y + (selHeight / 2) - (tooltipHeight / 2))];
      }
      // Left
      else if (x - tooltipWidth > 0 &&
        y - tooltipHeight / 3 > 0 &&
        y + tooltipHeight / 3 < chartHeight) {
        transform.translate =
          [(x - tooltipWidth + selHeight),
            (y + (selHeight / 2) - (tooltipHeight / 2))];
      }
      // Bottom
      else if (y + selHeight + tooltipHeight < chartHeight &&
        x + selWidth + tooltipWidth < chartWidth &&
        x - tooltipWidth > 0) {
        transform.translate =
           [(x + (selWidth / 3) - tooltipWidth / 3), y + selHeight + 5];
      }
      // Top
      else if (y - tooltipHeight > 0 &&
        x + selWidth + tooltipWidth < chartWidth &&
        x - tooltipWidth / 2 > 0) {
        transform.translate =
           [(x + (selWidth / 3) - tooltipWidth / 3), (y - tooltipHeight / 1.2)];
      }
      //Top Right
      else if (x + selWidth + tooltipWidth < chartWidth &&
        y - tooltipHeight > 0) {
          transform.translate = [(x + selWidth) , (y - tooltipHeight / 1.3)];
      }
      //Top Left
      else if (x - tooltipWidth > 0 && y - tooltipHeight > 0) {
        transform.translate =
          [(x - tooltipWidth / 1.2) , (y - tooltipHeight / 1.4)];
      }
      //Bottom Right
      else if (y + selHeight + tooltipHeight < chartHeight &&
        x + selWidth + tooltipWidth < chartWidth) {
        transform.translate = [(x + selWidth) , (y + selHeight)];
      }
      //Bottom Left
      else if (x - tooltipWidth > 0 &&
        y + selHeight + tooltipHeight < chartHeight) {
        transform.translate = [(x - tooltipWidth / 1.2) , (y + selHeight)];
      }

      _.root.attr('transform', transform.toString());
      tooltip.show();
    }

    /**
     * Hides the tooltip
     */
    function hideTooltip() {
      tooltip.hide();
    }

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
        'color',
        'opacity'
      ),
      mixins.component);

    tooltip.init();

    /**
     * Updates the tooltip component with new/updated data/config
     * @return {components.tooltip}
     */
    tooltip.update = function() {
      tooltip.show();
      var i, childNodes,
          root = _.root,
          content,
          size,
          message = _.config.message || '',
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
      size = content.size();
      root.select('.gl-tooltip-bg').attr({
        width: size[0] +  _.config.padding,
        height: size[1] +  _.config.padding
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
            .attr({
              fill: _.config.fillColor,
              stroke: _.config.strokeColor,
              'stroke-width': '2px',
              opacity: _.config.opacity
            });
          return root;
        });
      }
      _.globalPubsub.sub(tooltip.globalScope('tooltip-show'), displayTooltip);
      _.globalPubsub.sub(tooltip.globalScope('tooltip-hide'), hideTooltip);

      tooltip.emit('render');
      return tooltip;
    };

    /**
     * Destroys the tooltip and removes everything from the DOM.
     * @public
     */
    tooltip.destroy = fn.compose.call(tooltip, tooltip.destroy, function() {
      _.globalPubsub.unsub(tooltip.globalScope('tooltip-show'), displayTooltip);
      _.globalPubsub.unsub(tooltip.globalScope('tooltip-hide'), hideTooltip);
    });

    return tooltip();

  };
});
