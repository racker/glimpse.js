define([
  'graphs/graph-builder',
  'graphs/graph'
],
function(graphBuilder, graph) {
  'use strict';

  function filterComponents(g, type) {
    return g.component().filter(function(c) {
      return c.config('type') === type;
    });
  }

  describe('graphs.graphBuilder', function() {
    var testGraph, testData;

    beforeEach(function() {
      testData = {
        id: 'test-data',
        data: [{ x: 1, y: 1 }, { x: 2, y: 50 }, { x: 3, y: 100 }],
        dimensions: {
          x: 'x',
          y: 'y'
        }
      };
    });

    describe('create()', function() {

      beforeEach(function() {
        testGraph = graphBuilder.create('line');
        testGraph.config('xScale', d3.scale.linear());
        testGraph.data().add(testData);
      });

      it('reports the available buildable types', function() {
        expect(graphBuilder.types()).toEqual(['line', 'area']);
      });

      it('creates a graph', function() {
        expect(testGraph.toString()).toBe(graph().toString());
      });

      // TODO: Remove this once we have a comopnent manager.
      it('automatically adds a stats data source', function() {
        var statsData;
        testGraph.render(jasmine.htmlFixture());
        statsData = testGraph.data().get('gl-stats');
        expect(statsData.min).toBe(1);
        expect(statsData.avg).toBe(50);
        expect(statsData.max).toBe(100);
      });

      // TODO: Remove this once we have a comopnent manager.
      it('automatically adds a stats label component', function() {
        var statsComponent;
        statsComponent = testGraph.component('gl-stats');
        expect(statsComponent).toBeDefined();
      });

      it('removes corresponding components when data is removed', function() {
        var lineComponents;
        testGraph.data().remove('test-data');
        lineComponents = filterComponents(testGraph, 'line');
        expect(lineComponents.length).toBe(0);
      });

      describe('create("line")', function() {

        it('adds a single line component for a single data source', function() {
          var lineComponents;
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(1);
          expect(lineComponents[0].cid()).toBe('test-data');
        });

        it('adds a line component for each data source added', function() {
          var lineComponents;
          testGraph.data().add(testData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(2);
        });

      });

      describe('create("area")', function() {

        beforeEach(function() {
          testGraph = graphBuilder.create('area');
        });

        it('adds a single area component for a single data source', function() {
          var areaComponents;
          testGraph.data().add(testData);
          areaComponents = filterComponents(testGraph, 'area');
          expect(areaComponents.length).toBe(1);
          expect(areaComponents[0].cid()).toBe('test-data');
        });

        it('adds a line component for each data source added', function() {
          var areaComponents;
          testGraph.data().add(testData);
          testGraph.data().add(testData);
          areaComponents = filterComponents(testGraph, 'area');
          expect(areaComponents.length).toBe(2);
        });

      });

    });

  });

});
