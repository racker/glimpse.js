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
      positionPadding: 10,
      hiddenStates: ['empty', 'loading', 'error']
    };

    /**
     * Displays tooltip.
     * The tooltip is placed to bottom-right of the mouse position by default
     * Calculations are made to determine if the bottom-left corner
     * of the tooltip is inside the main container,
     * if not X and Y translates for tranform are calculated
     * so that the tooltip rect is inverted.
     * @param  {Object} dataPoint Closest point to the mouse. (output range)
     * @param  {Element} target
     * @param  {String} message Content to be displayed in
     *   tooltip
     */
    function displayTooltip(dataPoint, target, message) {
      var x = dataPoint.x,
        y = dataPoint.y,
        tooltipWidth,
        tooltipHeight,
        chart,
        chartWidth,
        chartHeight,
        positionPadding = _.config.positionPadding,
        translateX = x + positionPadding,
        translateY = y + positionPadding,
        transform = d3.transform();

      //Get the container
      //Makes an assumption that the main container is
      //parent's parent node.
      //TODO:Change the logic if/when we support nested components
      if (target.parentNode.parentNode) {
        chart = d3.select(target.parentNode.parentNode);
      } else {
        chart = d3.select(target.parentNode);
      }

      chartWidth = Math.round(chart.width()),
      chartHeight = Math.round(chart.height()),

      _.config.message = message;

      tooltip.update();

      tooltipWidth =  Math.round(_.root.width());
      tooltipHeight =  Math.round(_.root.height());

      //TODO: Make this a generic method that can be applied to any
      //container

      //Check if bottom-right corner is outside the chart
      //vertically
      if (chartHeight <= (y + positionPadding + tooltipHeight)) {
        translateY = y - positionPadding - tooltipHeight;
      }

      //Handle case where tooltip displays multiple messages
      if (translateY < 0) {
        translateY = chartHeight - tooltipHeight - positionPadding;
      }

      //Check if bottom-right corner is outside the chart
      //horizontally
      if (chartWidth <= (x + positionPadding + tooltipWidth)) {
        translateX = x - positionPadding - tooltipWidth;
      }

      transform.translate = [translateX, translateY];
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
          message = _.config.message || [];

      if (!_.root) {
        return tooltip;
      }
      if (_.config.cid) {
        _.root.attr('gl-cid', _.config.cid);
      }
      root.select('.gl-tooltip-content').remove();
      content = root.append('g').attr('class', 'gl-tooltip-content');

      message.forEach(function(line) {
        content.append('text')
          .attr({'xml:space': 'preserve', 'pointer-events': 'none'})
          .style({
            'font-family': 'sans-serif',
            'font-size': '10px',
            'fill': line.color,
          })
          .text(line.text);
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
              fill: _.config.fillColor,
              stroke: _.config.strokeColor,
              'stroke-width': '2px',
              opacity: _.config.opacity,
              'pointer-events': 'none'
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
