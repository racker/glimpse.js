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
      container = jasmine.svgFixture().append('g');
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
          'font-family': 'sans-serif',
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
          'font-family': 'sans-serif',
          'font-size': 10,
          'stroke-width': 1,
          'fill': 'none',
          'opacity': 0.8,
          'stroke': '#333'
        });
        expect(getComponentNode()).toHaveClasses('gl-axis', 'gl-x-axis');
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
          orient: 'right',
          height: 200
        });
        axis.render(container);
        expect(getComponentNode()).toHaveAttr('transform', 'translate(0,200)');
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
