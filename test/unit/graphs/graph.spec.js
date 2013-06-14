define([
  'graphs/graph',
  'core/asset-loader',
  'data/collection',
  'test-util/component',
  'components/line',
  'data/domain'
],
function(graph, assetLoader, dc, compUtil, lineComponent, domain) {
  'use strict';

  describe('graphs.graph', function() {
    var testGraph,
      defaults,
      epochBaseMs,
      fakeData,
      testComponent,
      xAxis,
      yAxis,
      legend,
      oneDayMs,
      xScale,
      yScale,
      dataCollection;

    defaults = {
    };

    epochBaseMs = 0;
    oneDayMs = 1000 * 60 * 60 * 24;

    fakeData = [{
      id:'fakeData',
      data: [
        { x: epochBaseMs + 0 * oneDayMs, y: 106},
        { x: epochBaseMs + 1 * oneDayMs, y: 56},
        { x: epochBaseMs + 2 * oneDayMs, y: 100},
        { x: epochBaseMs + 3 * oneDayMs, y: 103},
        { x: epochBaseMs + 4 * oneDayMs, y: 90},
        { x: epochBaseMs + 5 * oneDayMs, y: 200},
        { x: epochBaseMs + 6 * oneDayMs, y: 130}
      ]
    }];

    function setGraph() {
      testGraph
        .config({colorPalette: ['green'], yAxisUnit: 'ms'})
        .data([
          {
            id: 'fakeData',
            color: 'black',
            title: 'DFW',
            data: fakeData[0].data,
            dimensions: {
              x: function(d) { return d.x; },
              y: function(d) { return d.y; }
            }
          }
        ])
        .component([
          { cid: 'testComponent', type: 'line', dataId: 'fakeData' },
          { cid: 'testComponentWithColor', type: 'line',
            dataId: 'fakeData', color: 'red' }
        ]);
    }

    function setNoDataGraph() {
      testGraph
        .config({colorPalette: ['green']})
        .component([
          { cid: 'testComponent', type: 'line', dataId: 'fakeData' },
          { cid: 'testComponentWithColor',
              type: 'line', dataId: 'fakeData', color: 'red' }
        ]);
    }

    function setLegendSpies(){
      legend = testGraph.component('gl-legend');
      spyOn(legend, 'render').andCallThrough();
      spyOn(legend, 'update');
    }

    function setSpies() {
      testComponent = testGraph.component('testComponent');
      xAxis =  testGraph.component('gl-xaxis');
      yAxis =  testGraph.component('gl-yaxis');
      xScale = testGraph.config('xScale');
      yScale = testGraph.config('yScale');
      spyOn(assetLoader, 'loadAll');
      spyOn(testComponent, 'render');
      spyOn(xAxis, 'render').andCallThrough();
      spyOn(yAxis, 'render').andCallThrough();
      spyOn(testComponent, 'update');
      spyOn(xAxis, 'update');
      spyOn(yAxis, 'update');
      spyOn(yAxis, 'hide');
      spyOn(xAxis, 'hide');
      spyOn(xScale, 'domain').andCallThrough();
      spyOn(yScale, 'domain').andCallThrough();
    }

    beforeEach(function(){
      dataCollection = dc.create();
      testGraph = graph();
    });

    afterEach(function(){
      testGraph = null;
    });

    it('has required convenience functions', function() {
      expect(testGraph).toHaveProperties(
        'id',
        'height',
        'width'
      );
    });

    it('sets default X-Axis', function() {
      expect(testGraph.component('gl-xaxis')).toBeDefinedAndNotNull();
    });

    it('sets default Y-Axis', function() {
      expect(testGraph.component('gl-yaxis')).toBeDefinedAndNotNull();
    });

    it('sets unit on Y-Axis', function() {
      setGraph();
      testGraph.render(jasmine.htmlFixture());
      expect(testGraph.component('gl-yaxis').config('unit')).toBe('ms');
    });

    it('auto-sets data on new components via the data collection', function() {
      var newGraph, dataCollection, testLine;
      newGraph = graph();
      dataCollection = newGraph.data();
      newGraph.component({ cid: 'testLine', type: 'line', dataId: 'foo' });
      testLine = newGraph.component().first('testLine');
      dataCollection.add({ id: 'foo' });
      expect(testLine.data().id).toBe('foo');
    });

    describe('config()', function() {
      var config;

      beforeEach(function(){
        config = testGraph.config();
      });

      it('has default xScale set', function() {
        expect(config.xScale.toString()).toBe(d3.time.scale().toString());
      });

      it('has default yScale set', function() {
        expect(config.yScale.toString()).toEqual(d3.scale.linear().toString());
      });

      it('has default showLegend set', function() {
        expect(config.showLegend).toBe(true);
      });

      it('has default colorPalette set', function() {
        expect(config.colorPalette).toEqual(d3.scale.category10().range());
      });

      it('has default id set', function() {
        expect(config.id).toBeDefinedAndNotNull();
      });

    });

    describe('data()', function() {
      var dataWithAccessors, accessor;

      beforeEach(function() {
        accessor = {
          x: function(d) { return d.x + 2; },
          y: function(d) { return d.y + 2; }
        };

        dataWithAccessors = [{
          id:'dataWithAccessors',
          data: [
            { x: 13, y: 106},
            { x: 15, y: 56},
            { x: 17, y: 100}
          ],
          dimensions: {
            x: accessor.x,
            y: accessor.y
          }
        }];

      });

      it('gets/sets data', function() {
        testGraph.data(fakeData);
        expect(testGraph.data().get('fakeData')).toEqual(fakeData[0]);
      });

      it('appends data when object is passed', function() {
        testGraph.data(fakeData);
        expect(testGraph.data().get().length).toBe(1);
        testGraph.data({
          id:'moreFakeData',
          data: [
            {'x':13, 'y':106},
            {'x':15, 'y':56},
            {'x':17, 'y':100}
          ]
        });
        expect(testGraph.data().get().length).toBe(2);
      });

      it('sets default x accessor function if not provided', function() {
        var data;
        testGraph.data(fakeData);
        data = testGraph.data('fakeData');
        expect(data.x).toBeDefinedAndNotNull();
      });

      it('sets default y accessor function if not provided', function() {
        var data;
        testGraph.data(fakeData);
        data = testGraph.data('fakeData');
        expect(data.y).toBeDefinedAndNotNull();
      });

      it('sets provided x accessor function', function() {
        var data;
        testGraph.data(dataWithAccessors);
        data = testGraph.data('dataWithAccessors');
        expect(data.dimensions.x).toBe(accessor.x);

      });

      it('sets provided y accessor function', function() {
        var data;
        testGraph.data(dataWithAccessors);
        data = testGraph.data('dataWithAccessors');
        expect(data.dimensions.y).toBe(accessor.y);
      });

      it('updates object if id already exists', function() {
        var data, xAccessor;
        testGraph.data(dataWithAccessors);
        xAccessor = function(d) {
          return d.x + 10;
        };
        testGraph.data({
          id: 'dataWithAccessors',
          x: xAccessor
        });
        data = testGraph.data('dataWithAccessors');
        expect(data.x).toBe(xAccessor);
      });

    });

    describe('component()', function() {
      it('adds component', function() {
        testGraph.component({
          cid: 'testComponent',
          type: 'line',
          dataId: 'fakeData'
        });
        expect(testGraph.component('testComponent')).toBeDefinedAndNotNull();
      });

      it('returns a component when id is passed', function() {
        var line;
        testGraph.component({
          cid: 'testComponent',
          type: 'line',
          dataId: 'fakeData'
        });
        line = testGraph.component('testComponent');
        expect(line).toBeDefinedAndNotNull();
      });

      it('updates the config on the component', function() {
        var line;
        testGraph.component({
          cid: 'testComponent',
          type: 'line',
          dataId: 'fakeData',
          'strokeWidth': 5
        });
        line = testGraph.component('testComponent');
        expect(line.config().strokeWidth).toBe(5);
      });

    });

    describe('update()', function() {
      var selection, panel;

      beforeEach(function() {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        setLegendSpies();
        testGraph.update();
        panel = selection.select('svg');
      });

      it('calls domain for xScale', function() {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for xScale', function () {
        var start, end;
        start = new Date(xScale.domain()[0]).getTime();
        end = new Date(xScale.domain()[1]).getTime();
        expect(start).toBe(0);
        expect(end).toBe(fakeData[0].data[6].x);
      });

      it('updates domain for xScale based on domain interval period(days)',
        function() {
          var start, end;

          testGraph.config({
            domainIntervalUnit: 'day',
            domainIntervalPeriod: 2
          });
          testGraph.update();
          start = new Date(xScale.domain()[0]).getTime();
          end = new Date(xScale.domain()[1]).getTime();
          expect(start).toBe(fakeData[0].data[4].x);
          expect(end).toBe(fakeData[0].data[6].x);
        }
      );

      it('updates domain for xScale based on domain interval period(week)',
        function() {
          var start, end;

          testGraph.config({
            domainIntervalUnit: d3.time.week,
            domainIntervalPeriod: 1
          });
          testGraph.update();
          start = new Date(xScale.domain()[0]).getTime();
          end = new Date(xScale.domain()[1]).getTime();
          expect(start).toBe(fakeData[0].data[0].x);
          expect(end).toBe(fakeData[0].data[6].x);
        }
      );

      it('updates domain for yScale', function() {
        expect(yScale.domain()).toEqual([56, 240]);
      });

      it('updates domain for based on force property the config', function() {
        testGraph.config({
          forceY: [0]
        });
        testGraph.update();
        expect(yScale.domain()).toEqual([0, 240]);
      });

      it('updates domain for based on yDomainModifier', function() {
        expect(yScale.domain()).toEqual([56, 240]);
        testGraph.config({
          yDomainModifier: 1.5
        });
        testGraph.update();
        expect(yScale.domain()).toEqual([56, 300]);
      });

      it('calls domain for yScale', function() {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('updates the xScale based on domain Interval', function() {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('calls update on legend component', function() {
        expect(legend.update).toHaveBeenCalled();
      });

      it('calls update on y-axis component', function() {
        expect(yAxis.update).toHaveBeenCalled();
      });

      it('calls update on test component', function() {
        expect(testComponent.update).toHaveBeenCalled();
      });

      describe('components initial state after update/add', function() {
        var lineComponent, lineComponent1;

        beforeEach(function() {
            dataCollection = testGraph.data();
            lineComponent = testGraph.component('testComponent');
            lineComponent1 = testGraph.component('testComponentWithColor');
            spyOn(lineComponent, 'hide');
            spyOn(lineComponent1, 'hide');
        });

        it('does not hide components without a dataId', function() {
          dataCollection.toggleTags('fakeData', 'inactive');
          testGraph.update();
          expect(yAxis.hide).not.toHaveBeenCalled();
          expect(xAxis.hide).not.toHaveBeenCalled();
        });

        it('does not show components with dataId if inactive', function() {
          dataCollection.toggleTags('fakeData', 'inactive');
          testGraph.update();
          expect(lineComponent.hide).toHaveBeenCalled();
          expect(lineComponent1.hide).toHaveBeenCalled();
        });

      });

    });

    describe('domain', function() {
      var selection;

      function setupTest(sources) {
        setGraph();
        selection = jasmine.htmlFixture();
        spyOn(domain, 'addDomainDerivation').andCallThrough();
        if (sources) {
          testGraph.config({
            domainSources: sources
          });
        }
        testGraph.render(selection.node());
      }

      it('update delegates to domain for x and y', function() {
        setupTest();
        expect(domain.addDomainDerivation).toHaveBeenCalledOnce();
      });

      it('uses correct defaults such as source of * for x and y', function() {
        setupTest();
        expect(domain.addDomainDerivation).toHaveBeenCalledWith({
          x : { sources : '*', compute : 'interval',
            args : { unit : null, period : undefined },
            modifier : { force : undefined }, 'default' : [ 0, 0 ] },
          y : { sources : '*', compute : 'extent', modifier : {
            force : undefined, maxMultiplier : 1.2 }, 'default' : [ 0, 0 ] }
        }, testGraph.data());
      });

      it('sets sources for domain evaluation', function() {
        setupTest('DFW,ORD');
        expect(domain.addDomainDerivation).toHaveBeenCalledWith({
          x : { sources : 'DFW,ORD', compute : 'interval',
            args : { unit : null, period : undefined },
            modifier : { force : undefined }, 'default' : [ 0, 0 ] },
          y : { sources : 'DFW,ORD', compute : 'extent', modifier : {
            force : undefined, maxMultiplier : 1.2 }, 'default' : [ 0, 0 ] }
        }, testGraph.data());
      });

    });

    describe('render()', function() {
      var selection, panel, testLineComponent, componentManager;

      beforeEach(function() {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testLineComponent = lineComponent();
        spyOn(testLineComponent, 'show');
        testGraph.component(testLineComponent);
        testGraph.config('id', 'test');
        componentManager = testGraph.component();
        spyOn(componentManager, 'applySharedObject');
        testGraph.render(selection.node());
        panel = selection.select('svg');
      });

      it('loads assets via the asset loader', function() {
        expect(assetLoader.loadAll).toHaveBeenCalledOnce();
      });

      it('adds legend', function() {
        expect(testGraph.component('gl-legend')).toBeDefinedAndNotNull();
      });

      it('renders svg node', function() {
        expect(panel.node().nodeName.toLowerCase()).toBe('svg');
      });

      it('renders defs node', function() {
        var defs = panel.select('defs');
        expect(defs.node().nodeName.toLowerCase()).toBe('defs');
      });

      it('renders the primary container', function() {
        var group = panel.selectAttr('gl-container-name',
          testGraph.config('primaryContainer'));
        expect(group.node().nodeName.toLowerCase()).toBe('g');
      });

      it('updates domain for xScale', function() {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for yScale', function() {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('updates legend keys', function() {
        expect(legend.config().keys).toBeDefinedAndNotNull();
      });

      it('calls render on test component', function() {
        expect(testComponent.render).toHaveBeenCalled();
      });

      it('updates rootId on components', function() {
        expect(componentManager.applySharedObject)
          .toHaveBeenCalledWith('rootId', componentManager.cids());
      });

      it('calls render on x-axis component', function() {
        expect(xAxis.render).toHaveBeenCalled();
      });

      it('calls render on y-axis component', function() {
        expect(yAxis.render).toHaveBeenCalled();
      });

      it('updates the state display once', function() {
        expect(testLineComponent.show).toHaveBeenCalledOnce();
      });

      it('doesnt show the x-axis if there is no data', function() {
        var testGraph = graph();
        testGraph.render(selection);
        expect(testGraph.root().select('.gl-x-axis').node())
          .toHaveAttr('display', 'none');
      });

      it('shows the x-axis if there is data', function() {
        var testGraph = graph()
          .data(fakeData)
          .component({ type: 'line', dataId: 'fakeData' })
          .render(selection);
        expect(testGraph.root().select('.gl-x-axis').attr('display'))
          .toBeNull();
      });

      it('doesnt show the y-axis if there is no data', function() {
        var testGraph = graph();
        testGraph.render(selection);
        expect(testGraph.root().select('.gl-y-axis').node())
          .toHaveAttr('display', 'none');
      });

      it('shows the y-axis if there is data', function() {
        var testGraph = graph()
          .data(fakeData)
          .component({ type: 'line', dataId: 'fakeData' })
          .render(selection);
        expect(testGraph.root().select('.gl-y-axis').attr('display'))
          .toBeNull();
      });

      //TODO: tests for the layout of components.
      //dependency layout manager.

    });

    describe('component colors', function() {
      var selection, testComponentWithColor;

      beforeEach(function() {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        testComponentWithColor = testGraph.component('testComponentWithColor');
      });

      it('sets default color on component using colorPalette',
        function() {
          expect(testComponent.config().color).toBe('green');
        }
      );

      it('does not override the component color if set', function() {
        expect(testComponentWithColor.config().color).toBe('red');
      });
    });

    describe('state()', function() {
      var selection;

      beforeEach(function() {
        testGraph = graph();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
      });

      it('shows loading state', function() {
        testGraph.state('loading');
        expect(compUtil.getByCid('gl-loading-overlay').node())
          .not.toBeNull();
      });

      it('shows error state', function() {
        testGraph.state('error');
        expect(compUtil.getByCid('gl-error-overlay').node())
          .not.toBeNull();
      });

      it('shows empty state', function() {
        testGraph.state('empty');
        expect(compUtil.getByCid('gl-empty-overlay').node())
          .not.toBeNull();
      });

      it('hides x axis for empty state', function() {
        testGraph.state('empty');
        expect(compUtil.getByCid('gl-xaxis').node())
          .toHaveAttr('display', 'none');
      });

      it('hides y axis for empty state', function() {
        testGraph.state('empty');
        expect(compUtil.getByCid('gl-yaxis').node())
          .toHaveAttr('display', 'none');
      });

      it('has no overlays for "normal" state', function() {
        testGraph.state('normal');
        expect(selection.selectAll('.gl-overlay'))
          .toBeEmptySelection();
      });

      it('gets the current state', function() {
        expect(testGraph.state()).toBe('normal');
      });

      it('gets the current state after update', function() {
        testGraph.state('error');
        expect(testGraph.state()).toBe('error');
      });

      it('pulls state from the config', function() {
        testGraph.config('state', 'error');
        expect(testGraph.state()).toBe('error');
      });

      it('can set the state before rendering', function() {
        var anotherGraph = graph(), exThrown = false;
        try {
          anotherGraph.state('loading');
        }
        catch (e) {
          exThrown = true;
        }
        expect(exThrown).toBe(false);
        expect(anotherGraph.state()).toBe('loading');
      });

      it('shows the pre-configured state from before render', function() {
        var anotherGraph = graph();
        anotherGraph.state('empty');
        anotherGraph.render(selection);
        expect(compUtil.getByCid('gl-empty-overlay').node())
          .not.toBeNull();
      });

    });

    describe('hide()', function() {
      var selection;

      beforeEach(function() {
        setGraph();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
      });

      it('hides graph', function() {
        testGraph.hide();
        expect(testGraph.root().node()).toHaveAttr('display', 'none');
      });

    });

    describe('show()', function() {
      var selection;

      beforeEach(function() {
        setGraph();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        testGraph.hide();
      });

      it('shows graph', function() {
        testGraph.show();
        expect(testGraph.root().node()).not.toHaveAttr('display');
      });

    });

    describe('no data', function() {
      var selection, exceptionCaught;

      beforeEach(function() {
        exceptionCaught = false;
        selection = jasmine.svgFixture();
        try {
          testGraph.component({ type: 'line', dataId: 'foo' });
          testGraph.render(selection);
        }
        catch(e) {
          exceptionCaught = true;
        }
      });

      it('returns gracefully when rendered with no data', function() {
        expect(exceptionCaught).toBe(false);
      });

    });

    describe('no data set', function() {
      var selection, exThrown;

      beforeEach(function() {
        selection = jasmine.htmlFixture();
        setNoDataGraph();
        setSpies();
      });

      it('does not throw an error if no data is set', function () {
        exThrown = false;

        try {
          testGraph.render(selection.node());
        }
        catch (e) {
          exThrown = true;
        }
        expect(exThrown).toBe(false);
      });

      it('calls render on components after data is set',
        function () {
          testGraph.render(selection.node());
          testGraph.data(fakeData).update();
          expect(testComponent.render).toHaveBeenCalled();
      });

      it('sets data on component after data is set(post render)',
        function () {
          testGraph.render(selection.node());
          testGraph.data(fakeData).update();
          expect(testComponent.data()).toBe(fakeData[0]);
      });

    });

    describe('destroy', function() {
      var selection;

      beforeEach(function() {
        setGraph();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        testGraph.destroy();
      });

      it('sets root to null', function() {
        expect(testGraph.root()).toBe(null);
      });

    });

    describe('dispatch', function() {
      var renderSpy, newGraph;

      beforeEach(function() {
        newGraph = graph();
        renderSpy = jasmine.createSpy();
        testGraph.dispatch.on('render', renderSpy);
      });

      it('contains a render method', function() {
        expect(testGraph.dispatch.render).toBeOfType('function');
      });

      it('contains an update method', function() {
        expect(testGraph.dispatch.update).toBeOfType('function');
      });

      it('contains a destroy method', function() {
        expect(testGraph.dispatch.destroy).toBeOfType('function');
      });

      it('contains a state method', function() {
        expect(testGraph.dispatch.state).toBeOfType('function');
      });

    });

    //TODO: Add tests to check if the 'showLegend' config works

  });

});
