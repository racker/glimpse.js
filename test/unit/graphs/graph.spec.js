define([
  'graphs/graph',
  'core/asset-loader',
  'data/collection',
  'test-util/component'
],
function(graph, assetLoader, dc, compUtil) {
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
      marginTop: 10,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 0
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
        .config({colorPalette: ['green']})
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
        .component({ cid: 'testComponent', type: 'line', dataId: 'fakeData' })
        .component({ cid: 'testComponentWithColor',
          type: 'line', dataId: 'fakeData', color: 'red' })
        .xAxis({ cid: 'xAxis' })
        .yAxis({ cid: 'yAxis' })
        .legend({ cid: 'legend' });
    }

    function setSpies() {
      testComponent = testGraph.component('testComponent');
      xAxis =  testGraph.xAxis();
      yAxis =  testGraph.yAxis();
      legend = testGraph.legend();
      xScale = testGraph.config().xScale;
      yScale = testGraph.config().yScale;
      spyOn(assetLoader, 'loadAll');
      spyOn(testComponent, 'render');
      spyOn(xAxis, 'render').andCallThrough();
      spyOn(yAxis, 'render').andCallThrough();
      spyOn(legend, 'render').andCallThrough();
      spyOn(testComponent, 'update');
      spyOn(xAxis, 'update');
      spyOn(yAxis, 'update');
      spyOn(legend, 'update');
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
      expect(testGraph.xAxis()).toBeDefinedAndNotNull();
    });

    it('sets default Y-Axis', function() {
      expect(testGraph.yAxis()).toBeDefinedAndNotNull();
    });

    describe('config()', function() {
      var config;

      beforeEach(function(){
        config = testGraph.config();
      });

      it('has default marginTop', function() {
        expect(config.marginTop).toBe(defaults.marginTop);
      });

      it('has default marginRight', function() {
        expect(config.marginRight).toBe(defaults.marginRight);
      });

      it('has default marginBottom', function() {
        expect(config.marginBottom).toBe(defaults.marginBottom);
      });

      it('has default marginLeft', function() {
        expect(config.marginLeft).toBe(defaults.marginLeft);
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
        expect(config.colorPalette).toEqual(d3.scale.category20().range());
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

    describe('appendData()', function() {
      var someData;

      beforeEach(function() {
        var selection = jasmine.htmlFixture();

        someData = {
          id:'someData',
          data: [
            { x: 13, y: 106},
            { x: 15, y: 56},
            { x: 17, y: 100}
          ]
        };

        testGraph.data(someData);
        testGraph.render(selection.node());

      });

      it('pushes data for a given id', function() {
        expect(testGraph.data('someData').data.length).toBe(3);
        testGraph.appendData('someData', { x: 14, y: 106});
        testGraph.update();
        expect(testGraph.data('someData').data.length).toBe(4);
      });

      it('concats array of data for a given id', function() {
        expect(testGraph.data('someData').data.length).toBe(3);
        testGraph.appendData('someData', [{ x: 18, y: 156}, { x: 15, y: 196}])
          .update();
        expect(testGraph.data('someData').data.length).toBe(5);
      });

    });

    describe('component()', function() {
      it('adds component', function() {
        testGraph.component({
          cid: 'testComponent',
          type: 'line',
          dataId: 'fakeData'
        });
        expect(testGraph.component().length).toBe(1);
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
            domainIntervalUnit: d3.time.day,
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

    });

    describe('render()', function() {
      var selection, panel;

      beforeEach(function() {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        panel = selection.select('svg');
      });

      it('loads assets via the asset loader', function() {
        expect(assetLoader.loadAll).toHaveBeenCalledOnce();
      });

      it('adds legend', function() {
         expect(testGraph.legend()).toBeDefinedAndNotNull();
      });

      it('renders svg node', function() {
        expect(panel.node().nodeName.toLowerCase()).toBe('svg');
      });

      it('renders defs node', function() {
        var defs = panel.select('defs');
        expect(defs.node().nodeName.toLowerCase()).toBe('defs');
      });

      it('renders framed components group', function() {
        var group = panel.select('.gl-framed');
        expect(group.node().nodeName.toLowerCase()).toBe('g');
      });

      it('updates domain for xScale', function() {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for yScale', function() {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('updates legend', function() {
        expect(legend.update).toHaveBeenCalled();
      });

      it('updates legend keys', function() {
        expect(legend.config().keys).toBeDefinedAndNotNull();
      });

      it('calls render on test component', function() {
        expect(testComponent.render).toHaveBeenCalled();
      });

      it('calls render on legend component', function() {
        expect(legend.render).toHaveBeenCalled();
      });

      it('calls render on x-axis component', function() {
        expect(xAxis.render).toHaveBeenCalled();
      });

      it('calls render on y-axis component', function() {
        expect(yAxis.render).toHaveBeenCalled();
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
        expect(compUtil.getByCid('loadingOverlay').node())
          .not.toBeNull();
      });

      it('shows error state', function() {
        testGraph.state('error');
        expect(compUtil.getByCid('errorOverlay').node())
          .not.toBeNull();
      });

      it('shows empty state', function() {
        testGraph.state('empty');
        expect(compUtil.getByCid('emptyOverlay').node())
          .not.toBeNull();
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
        expect(compUtil.getByCid('emptyOverlay').node())
          .not.toBeNull();
      });

    });

    describe('x domain label', function() {
      var domain, formatter, label, xScale;

      beforeEach(function() {
        domain = [new Date(0), new Date(34347661000)];
        formatter = testGraph.config('xDomainLabelFormatter');
        testGraph.render(jasmine.htmlFixture());
        label = testGraph.component('xDomainLabel');
        xScale = testGraph.config('xScale');
      });

      it('formats dates correctly using default formatter', function() {
        expect(formatter(domain)).toBe('Jan 1, 12:00 AM - Feb 2, 01:01 PM UTC');
      });

      it('renders the label', function() {
        expect(compUtil.getByCid('xDomainLabel').node()).toBeDefined();
      });

      it('has an xDomainLabel component', function() {
        expect(label).toBeDefined();
      });

      it('updates the text when the domain changes', function() {
        xScale.domain([0, 44715661000]);
        testGraph.update();
        expect(label.text()).toBe('Jan 1, 12:00 AM - Jun 2, 01:01 PM UTC');
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

      it('hides component', function() {
        var c = testGraph.component('testComponent');

        testGraph.hide('testComponent');
        expect(c.root().node()).toHaveAttr('display', 'none');
      });

      it('hides components', function() {
        var c, yAxis;
        c = testGraph.component('testComponent');
        yAxis = testGraph.component('yAxis');

        testGraph.hide(['testComponent', 'yAxis']);
        expect(c.root().node()).toHaveAttr('display', 'none');
        expect(yAxis.root().node()).toHaveAttr('display', 'none');
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

      it('shows component', function() {
        var c = testGraph.component('testComponent');

        testGraph.show('testComponent');
        expect(c.root().node()).not.toHaveAttr('display');
      });

      it('shows components', function() {
        var c, yAxis;
        c = testGraph.component('testComponent');
        yAxis = testGraph.component('yAxis');

        testGraph.show(['testComponent', 'yAxis']);
        expect(c.root().node())
          .not.toHaveAttr('display');

        expect(yAxis.root().node())
          .not.toHaveAttr('display');
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

      it('returns graceully when rendered with no data', function() {
        expect(exceptionCaught).toBe(false);
      });

    });

    describe('removeData()', function() {
      var idMapper;
      idMapper = function(d) {
        return d.id;
      };

      beforeEach(function() {
        testGraph.data([
          { id: 'one', data: [] },
          { id: 'two', data: [] },
          { id: 'three', data: [] }
        ]);
      });

      it('removes a single data item from the collection', function() {
        testGraph.removeData('one');
        expect(testGraph.data().get().map(idMapper)).toEqual(['two', 'three']);
      });

      it('removes multiple data items from the collection', function() {
        testGraph.removeData(['one', 'two']);
        expect(testGraph.data().get().map(idMapper)).toEqual(['three']);
      });

      it('does nothing if data id doesnt exist', function() {
        var exThrown = false;
        try {
          testGraph.removeData('nonsense');
        }
        catch (e) {
          exThrown = true;
        }
        expect(exThrown).toBe(false);
        expect(testGraph.data().get().length).toBe(3);
      });

    });

    describe('removeComponent', function() {
      var c1, c2, c3, cidMapper;

      cidMapper = function(c) {
        return c.cid();
      };

      beforeEach(function() {
        testGraph.component({ cid: 'c1', type: 'line' });
        testGraph.component({ cid: 'c2', type: 'line' });
        testGraph.component({ cid: 'c3', type: 'line' });
        c1 = testGraph.component('c1');
        c2 = testGraph.component('c2');
        c3 = testGraph.component('c3');
        spyOn(c1, 'destroy');
        spyOn(c2, 'destroy');
        spyOn(c3, 'destroy');
      });

      it('removes a single component', function() {
        testGraph.removeComponent('c1');
        expect(testGraph.component().map(cidMapper)).toEqual(['c2', 'c3']);
      });

      it('removes multiple components', function() {
        testGraph.removeComponent(['c1', 'c2']);
        expect(testGraph.component().map(cidMapper)).toEqual(['c3']);
      });

      it('calls destroy() when removing a component', function() {
        testGraph.removeComponent('c1');
        expect(c1.destroy).toHaveBeenCalledOnce();
        expect(c2.destroy).not.toHaveBeenCalled();
        expect(c3.destroy).not.toHaveBeenCalled();
      });

    });

  });

});
