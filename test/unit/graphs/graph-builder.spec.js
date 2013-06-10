define([
  'graphs/graph-builder',
  'graphs/graph',
  'test-util/d3interaction'
],
function(graphBuilder, graph, d3interaction) {
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

      describe('accepts a sources option', function() {

        var derivedData, newData;

        function createWithSources(sources) {
          testGraph = graphBuilder.create('line', { sources: sources });
          testGraph.config({
            'xScale': d3.scale.linear(),
            'yAxisUnit': 'GB'
          });
        }

        beforeEach(function() {
          derivedData = {
            id: 'derived-data',
            sources: '',
            derivation: function() {
              return [{ x: 1, y: 1 }, { x: 2, y: 50 }, { x: 3, y: 100 }];
            }
          };
          newData = {
            id: 'new-data',
            data: [{ x: 1, y: 1 }, { x: 2, y: 150 }, { x: 3, y: 300 }],
            dimensions: {
              x: 'x',
              y: 'y'
            }
          };
        });

        it('adds testdata line comp if sources is not specified', function() {
          var lineComponents;
          createWithSources();
          testGraph.data(testData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(1);
          expect(lineComponents[0].cid()).toBe('test-data');
        });

        it('doesnt add testdata line comp if not in sources', function() {
          var lineComponents;
          createWithSources(['xyz', 'data2']);
          testGraph.data(testData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(0);
        });

        it('add testdata line comp if it is in sources', function() {
          var lineComponents;
          createWithSources(['xyz', 'test-data']);
          testGraph.data(testData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(1);
          expect(lineComponents[0].cid()).toBe('test-data');
        });

        it('doesnt add derived data line comp if not in sources', function() {
          var lineComponents;
          createWithSources(['xyz', 'data2']);
          testGraph.data(derivedData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(0);
        });

        it('add derived data line comp if it is in sources', function() {
          var lineComponents;
          createWithSources(['xyz', 'derived-data']);
          testGraph.data(derivedData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(1);
          expect(lineComponents[0].cid()).toBe('derived-data');
        });

        it('add derived & std data line comp if in sources', function() {
          var lineComponents;
          createWithSources(['test-data', 'derived-data']);
          testGraph.data(derivedData);
          testGraph.data(testData);
          lineComponents = filterComponents(testGraph, 'line');
          expect(lineComponents.length).toBe(2);
          expect(lineComponents[0].cid()).toBe('derived-data');
          expect(lineComponents[1].cid()).toBe('test-data');
        });

        it('calculates stats data from all added data', function() {
          var renderTarget = jasmine.htmlFixture(),
              stats;
          createWithSources();
          testGraph.data(testData);
          testGraph.data(newData);
          testGraph.render(renderTarget);
          stats = testGraph.data().get('gl-stats');
          expect(stats.min).toBe(1);
          expect(stats.max).toBe(300);
          expect(stats.avg).toBe(100);
        });

        it('calculates stats data from data specified in sources', function() {
          var renderTarget = jasmine.htmlFixture(),
              stats;
          createWithSources(['test-data']);
          testGraph.data(testData);
          testGraph.data(newData);
          testGraph.render(renderTarget);
          stats = testGraph.data().get('gl-stats');
          expect(stats.min).toBe(1);
          expect(stats.max).toBe(100);
          expect(stats.avg).toBe(50);
        });

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

        it('legend renders when data is added to collection', function() {
          var dc = testGraph.data(),
              renderTarget = jasmine.htmlFixture(),
              legendContainer;
          dc.add(testData);
          testGraph.render(renderTarget);
          legendContainer = renderTarget.select('.gl-legend').node();
          expect(legendContainer.childNodes.length).toBe(1);
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

        it('has correct stats', function() {
          var renderTarget = jasmine.htmlFixture(),
              dc = testGraph.data(),
              stats;
          addCpuSysData();
          addCpuUserData();
          testGraph.render(renderTarget);
          stats = dc.get('gl-stats');
          expect(stats.min).toBe(19);
          expect(stats.max).toBe(40);
          expect(stats.avg).toBe(26);
        });

        it('renders new components on update', function() {
          var renderTarget = jasmine.htmlFixture(),
              cm, sysRender, userRender;
          testGraph = graphBuilder.create('stacked-area');
          cm = testGraph.component();
          testGraph.render(renderTarget);
          addCpuSysData();
          addCpuUserData();
          sysRender = spyOn(cm.first('cpu-sys-stack'), 'render')
                     .andCallThrough();
          userRender = spyOn(cm.first('cpu-user-stack'), 'render')
                     .andCallThrough();
          testGraph.update();
          expect(sysRender).toHaveBeenCalled();
          expect(userRender).toHaveBeenCalled();
        });

        describe('legend', function() {

          var renderTarget, legend1, legend2;

          beforeEach(function() {
            renderTarget = jasmine.htmlFixture();
            addCpuSysData();
            addCpuUserData();
            testGraph.render(renderTarget);
            legend1 = renderTarget.selectAll('.gl-legend-key')[0][0];
            legend2 = renderTarget.selectAll('.gl-legend-key')[0][1];
          });

          it('sets up legend click handlers', function() {
            expect(legend1).toHaveClickHandler();
            expect(legend2).toHaveClickHandler();
          });

          it('legend click hides area', function() {
            var cpuStack = testGraph.component().first('cpu-sys-stack');
            spyOn(cpuStack, 'hide').andCallThrough();
            d3interaction.click(legend1);
            expect(cpuStack.hide).toHaveBeenCalled();
          });

          it('legend click recomputes stack', function() {
            spyOn(d3.layout, 'stack').andCallThrough();
            d3interaction.click(legend1);
            expect(d3.layout.stack).toHaveBeenCalled();
          });

          it('has correct stats when sys legend is clicked', function () {
            var dc = testGraph.data(),
                stats;
            d3interaction.click(legend1);
            stats = dc.get('gl-stats');
            expect(stats.min).toBe(19);
            expect(stats.max).toBe(21);
            expect(stats.avg).toBe(21);
          });

           it('has correct stats when all legends are clicked', function () {
            var dc = testGraph.data(),
                stats;
            d3interaction.click(legend1);
            d3interaction.click(legend2);
            stats = dc.get('gl-stats');
            expect(stats.min).toBe(0);
            expect(stats.max).toBe(0);
            expect(stats.avg).toBe(0);
          });


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

      describe('create("sparkline")', function() {

        beforeEach(function() {
          testGraph = graphBuilder.create('sparkline');
          testGraph.data().add(testData);
        });

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

        it('adds only y-axis to sparkline', function() {
          var axisComponents;
          axisComponents = filterComponents(testGraph, 'axis');
          expect(axisComponents.length).toBe(1);
          expect(axisComponents[0].config('axisType')).toBe('y');
        });

        it('does not add x-axis to sparkline', function() {
          var axisComponents;
          axisComponents = filterComponents(testGraph, 'axis');
          expect(axisComponents[0].config('axisType')).not.toBe('x');
        });

        it('does not add legend to sparkline', function() {
          var legendComponents;
          legendComponents = filterComponents(testGraph, 'gl-legend');
          expect(legendComponents.length).toBe(0);
        });

        it('does not add any labels to sparkline', function() {
          var labelComponents;
          labelComponents = filterComponents(testGraph, 'label');
          expect(labelComponents.length).toBe(0);
        });

        it('does not add stats to sparkline', function() {
          var statsComponents;
          statsComponents = filterComponents(testGraph, 'gl-stats');
          expect(statsComponents.length).toBe(0);
        });

        it('does not add domains to sparkline', function() {
          var domainComponents;
          domainComponents = filterComponents(testGraph, 'gl-domain-label');
          expect(domainComponents.length).toBe(0);
        });

        it('does not add legend to sparkline', function() {
          var legendComponents;
          legendComponents = filterComponents(testGraph, 'legend');
          expect(legendComponents.length).toBe(0);
        });

        it('sets the layout to sparkline', function() {
          expect(testGraph.config('layout')).toBe('sparkline');
        });

      });

    });

  });

});
