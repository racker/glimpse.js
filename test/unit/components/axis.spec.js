define([
  'components/axis'
],
function (axisComponent) {
  'use strict';

  describe('components.axis', function () {

    var componentId = 'axis123',
        axis, container, node;

    function getComponentNode() {
      return container.select('#' + componentId).node();
    }

    beforeEach(function() {
      container = jasmine.svgFixture().append('g').size(400, 200);
      axis = axisComponent();
      axis.config({id: componentId });
    });

    it('axis to be defined', function () {
      expect(axis).toBeDefinedAndNotNull();
    });

    describe('.render()', function() {

      it('handles defaults', function () {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom'
        });
        axis.render(container);

        node = getComponentNode();

        expect(node).toHaveAttr({
          'shape-rendering': 'crispEdges',
          'font-family': 'arial',
          'font-size': '10',
          'fill': 'none',
          'stroke-width': 1,
          'stroke': '#333',
          'opacity': 0.8
        });
        expect(node).toHaveClasses('gl-axis', 'gl-x-axis');
      });

      it('renders x axis', function () {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom'
        });
        axis.render(container);
        expect(node).toHaveAttr({
          'shape-rendering': 'crispEdges',
          'font-family': 'arial',
          'font-size': 10,
          'stroke-width': 1,
          'fill': 'none',
          'opacity': 0.8,
          'stroke': '#333'
        });
        expect(getComponentNode()).toHaveClasses('gl-axis', 'gl-x-axis');
      });

      it('sets tickSize to 0 by default', function () {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom'
        });
        axis.render(container);
        expect(axis.d3axis().tickSize()).toBe(0);
      });

      it('sets tickSize to configured value', function () {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom',
          tickSize: 5
        });
        axis.render(container);
        expect(axis.d3axis().tickSize()).toBe(5);
      });

      it('sets ticks if configured axis', function () {
        axis.config({
          type: 'x',
          scale: d3.scale.linear().domain([5,10]),
          orient: 'left',
          ticks: 3
        });
        axis.render(container);
        expect(axis.d3axis().ticks()[0]).toBe(3);
      });

      it('renders y axis', function () {
        axis.config({
          type: 'y',
          scale: d3.scale.linear(),
          orient: 'right'
        });
        axis.render(container);
        expect(getComponentNode()).toHaveClasses('gl-axis', 'gl-y-axis');
      });

      it('positions x axis', function () {
        axis.config({
          type: 'x',
          scale: d3.scale.linear(),
          orient: 'right'
        });
        axis.render(container);
        expect(getComponentNode()).toHaveTranslate(0, 200);
      });

      it('does not position y axis', function () {
        axis.config({
          type: 'y',
          scale: d3.scale.linear(),
          orient: 'right',
          height: 200
        });
        axis.render(container);
        expect(getComponentNode()).not.toHaveAttr('transform');
      });

      describe('axis label background', function() {

        it('is inserted into the d3 svg axis component', function() {
          var axisGroups;
          axis.config({
            type: 'x',
            scale: d3.scale.linear(),
            orient: 'right'
          });
          axis.render(container);
          axisGroups = d3.select(getComponentNode()).selectAll('.gl-axis g');
          expect(axisGroups.empty()).toBe(false);
          axisGroups.each(function() {
            var g = d3.select(this), len;
            len = g.selectAll('text')[0].length;
            expect(len).toBe(2);
            expect(g.select('text').node()).toHaveAttr({
              'stroke-width': 3,
              'stroke': '#fff'
            });
          });
        });

        it('has the right defaults applied in the dom', function() {
          var axisGroups;
          axis.config({
            type: 'x',
            scale: d3.scale.linear(),
            orient: 'right',
            textBgColor: 'green',
            textBgSize: 4
          });
          axis.render(container);
          axisGroups = d3.select(getComponentNode()).selectAll('.gl-axis g');
          expect(axisGroups.empty()).toBe(false);
          axisGroups.each(function() {
            var g = d3.select(this), len;
            len = g.selectAll('text')[0].length;
            expect(len).toBe(2);
            expect(g.select('text').node()).toHaveAttr({
              'stroke-width': 4,
              'stroke': 'green'
            });
          });
        });

      });

    });

  });

});
