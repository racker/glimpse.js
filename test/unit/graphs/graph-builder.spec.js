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
    var testGraph, testData, testData1;

    beforeEach(function() {
      testData = {
        id: 'test-data',
        data: [{ x: 1, y: 1 }, { x: 2, y: 50 }, { x: 3, y: 100 }],
        dimensions: {
          x: 'x',
          y: 'y'
        }
      },
      testData1 = {
        id: 'test-data1',
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
        testGraph.config({
          'xScale': d3.scale.linear(),
          'yAxisUnit': 'GB'
        });
        testGraph.data(testData);
      });

      it('adds two labels (domain range and stats label)', function() {
        var selection = jasmine.htmlFixture();
        testGraph.render(selection);
        expect(selection.selectAll('.gl-label')).toBeSelectionLength(2);
      });

      it('reports the available buildable types', function() {
        expect(graphBuilder.types()).toEqual(['line', 'area', 'stacked-area']);
      });

      it('creates a graph', function() {
        expect(testGraph.toString()).toBe(graph().toString());
      });

      // TODO: Remove this once we have total config-based comopnents.
      it('automatically adds a stats data source', function() {
        var statsData;
        testGraph.render(jasmine.htmlFixture());
        statsData = testGraph.data().get('gl-stats');
        expect(statsData.min).toBe(1);
        expect(statsData.avg).toBe(50);
        expect(statsData.max).toBe(100);
      });

      // TODO: Remove this once we have total config-based comopnents.
      it('automatically adds a stats label component', function() {
        var statsComponent;
        statsComponent = testGraph.component('gl-stats');
        expect(statsComponent).toBeDefined();
      });

      // TODO: Remove this once we have total config-based comopnents.
      it('recalculates avg/min/max on data-toggle event', function() {
        var statsData, dc;
        testGraph.render(jasmine.htmlFixture());
        dc = testGraph.data();
        dc.toggleTags('test-data', 'inactive');
        statsData = testGraph.data().get('gl-stats');
        expect(statsData.min).toBe(0);
        expect(statsData.avg).toBe(0);
        expect(statsData.max).toBe(0);
      });

      it('sets unit on stats label', function() {
        testGraph.render(jasmine.htmlFixture());
        expect(testGraph.component('gl-stats').config('unit')).toBe('GB');
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
          testGraph.data().add(testData1);
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
          testGraph.data().add(testData1);
          areaComponents = filterComponents(testGraph, 'area');
          expect(areaComponents.length).toBe(2);
        });

      });

      describe('create("stacked-area")', function() {

        beforeEach(function() {
          testGraph = graphBuilder.create('stacked-area');
        });

        function addCpuSysData() {
          testGraph.data().add({
            'id' : 'cpu-sys',
            'title' : 'sys',
            'data': [
              { 'x': 1317279600000, 'y': 30 },
              { 'x': 1317695968421, 'y': 31 },
              { 'x': 1318112336842, 'y': 30 },
              { 'x': 1318528705263, 'y': 30 },
              { 'x': 1318945073684, 'y': 40 },
              { 'x': 1319361442105, 'y': 30 }
            ],
            dimensions: {
              x: 'x', y: 'y'
            }
          });
        }

        function addCpuUserData() {
          testGraph.data().add({
            'id': 'cpu-user',
            'title': 'user',
            'data': [
              { 'x': 1317279600000, 'y': 20 },
              { 'x': 1317695968421, 'y': 19 },
              { 'x': 1318112336842, 'y': 21 },
              { 'x': 1318528705263, 'y': 21 },
              { 'x': 1318945073684, 'y': 21 },
              { 'x': 1319361442105, 'y': 21 }
            ],
            dimensions: {
              x: 'x', y: 'y'
            }
          });
        }

        it('adds a single stacked-area derived data source', function() {
          addCpuUserData();
          expect(testGraph.data().get('cpu-user-stack'))
            .toBe('gl-error-not-computed');
         expect(testGraph.data().get('cpu-sys-stack'))
            .toBe(null);
        });

        it('adds a single stacked-area component', function() {
          var areaComponents;
          addCpuUserData();
          areaComponents = filterComponents(testGraph, 'area');
          expect(areaComponents.length).toBe(1);
          expect(areaComponents[0].cid()).toBe('cpu-user-stack');
        });

        it('adds multiple stacked-area derived data sources', function() {
          addCpuSysData();
          addCpuUserData();
          expect(testGraph.data().get('cpu-user-stack'))
            .toBe('gl-error-not-computed');
          expect(testGraph.data().get('cpu-sys-stack'))
            .toBe('gl-error-not-computed');
        });

        it('adds multiple stacked-area components', function() {
          var areaComponents;
          addCpuSysData();
          addCpuUserData();
          areaComponents = filterComponents(testGraph, 'area');
          expect(areaComponents.length).toBe(2);
          expect(areaComponents[0].cid()).toBe('cpu-sys-stack');
          expect(areaComponents[1].cid()).toBe('cpu-user-stack');
        });

        it('computes stack data correctly for cpu-user', function() {
          var renderTarget = jasmine.htmlFixture();
          addCpuSysData();
          addCpuUserData();
          testGraph.render(renderTarget);
          expect(testGraph.data().get('cpu-user-stack').data).toEqual([
            { x : 1317279600000, y : 20, y0 : 30 },
            { x : 1317695968421, y : 19, y0 : 31 },
            { x : 1318112336842, y : 21, y0 : 30 },
            { x : 1318528705263, y : 21, y0 : 30 },
            { x : 1318945073684, y : 21, y0 : 40 },
            { x : 1319361442105, y : 21, y0 : 30 }]);
        });

      });

    });

  });

});
