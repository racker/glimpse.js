define([
  'components/axis'
],
function(axisComponent) {
  'use strict';

  describe('components.axis', function() {

    var componentId = 'axis123',
        axis, container, node;

    function getComponentNode() {
      return container.select('[gl-cid=' + componentId + ']').node();
    }

    beforeEach(function() {
      container = jasmine.svgFixture().append('g').size(400, 200);
      axis = axisComponent();
      axis.config({cid: componentId });
    });

    it('axis to be defined', function() {
      expect(axis).toBeDefinedAndNotNull();
    });

    it('has required set of properties', function() {
      expect(axis).toHaveProperties(
        'show',
        'hide',
        'destroy'
      );
    });

    describe('.render()', function() {

      it('handles defaults', function() {
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

      it('renders x axis', function() {
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

      it('sets tickSize to 0 by default', function() {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom'
        });
        axis.render(container);
        expect(axis.d3axis().tickSize()).toBe(0);
      });

      it('sets tickSize to configured value', function() {
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom',
          tickSize: 5
        });
        axis.render(container);
        expect(axis.d3axis().tickSize()).toBe(5);
      });

      it('sets ticks if configured axis', function() {
        axis.config({
          type: 'x',
          scale: d3.scale.linear().domain([5,10]),
          orient: 'left',
          ticks: 3
        });
        axis.render(container);
        expect(axis.d3axis().ticks()[0]).toBe(3);
      });

      it('renders y axis', function() {
        axis.config({
          type: 'y',
          scale: d3.scale.linear(),
          orient: 'right'
        });
        axis.render(container);
        expect(getComponentNode()).toHaveClasses('gl-axis', 'gl-y-axis');
      });

      it('does not position y axis', function() {
        axis.config({
          type: 'y',
          scale: d3.scale.linear(),
          orient: 'right',
          height: 200
        });
        axis.render(container);
        expect(getComponentNode()).not.toHaveAttr('transform');
      });

      it('it applies padding 0 tick', function() {
        var zeroTick, transform;
        axis.config({
          type: 'y',
          scale: d3.scale.linear()
        });
        axis.render(container);
        zeroTick = d3.select(getComponentNode()).select('.gl-axis g');
        transform = d3.transform(zeroTick.attr('transform'));
        expect(transform.translate[1]).toBe(-10);
      });

      it('it applies unit to 0 tick', function() {
        var zeroTick;
        axis.config({
          type: 'y',
          scale: d3.scale.linear(),
          unit: 'ms'
        });
        axis.render(container);
        zeroTick = d3.select(getComponentNode()).select('.gl-axis g');
        expect(zeroTick.select('text').text()).toBe('0.0 ms');
      });

      describe('axis label background', function() {

        it('is inserted into the d3 svg axis component', function() {
          var axisGroups;
          axis.config({
            type: 'x',
            scale: d3.scale.linear().domain([0, 100]).range([0,100]),
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

    describe('.update()', function() {

      beforeEach(function() {
        axis.render(container);
      });

      it('repositions itself to the bottom of its parents DOM', function() {
        container.append('g');
        axis.update();
        expect(axis.root().node()).toBe(container.node().lastElementChild);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        container.selectAll('*').remove();
        axis.config({
          type: 'x',
          scale: d3.time.scale(),
          orient: 'bottom'
        });
        axis.render(container);
        axis.destroy();
      });

      it('removes all child nodes', function() {
        expect(container.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
