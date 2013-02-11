define([
  'graphs/graph',
  'core/asset-loader',
  'test-util/component'
],
function (graph, assetLoader, compUtil) {
  'use strict';

  describe('graphs.graph', function () {
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
      yScale;

    defaults = {
      marginTop: 10,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 0
    };

    epochBaseMs = new Date('Tue Jan 29 2013 17:13:34 GMT-0800 (PST)').getTime();
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
        .data([
          {
            id: 'fakeData',
            color: 'black',
            title: 'DFW',
            data: fakeData[0].data,
            x: function (d) { return d.x; },
            y: function (d) { return d.y; }
          }
        ])
        .component({ cid: 'testComponent', type: 'line', dataId: 'fakeData' })
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
      spyOn(xAxis, 'render');
      spyOn(yAxis, 'render');
      spyOn(legend, 'render');
      spyOn(testComponent, 'update');
      spyOn(xAxis, 'update');
      spyOn(yAxis, 'update');
      spyOn(legend, 'update');
      spyOn(xScale, 'domain').andCallThrough();
      spyOn(yScale, 'domain').andCallThrough();
    }

    beforeEach(function (){
      testGraph = graph();
    });

    afterEach(function (){
      testGraph = null;
    });

    it('has required convenience functions', function () {
      expect(testGraph).toHaveProperties(
        'id',
        'height',
        'width'
      );
    });

    it('sets default X-Axis', function () {
      expect(testGraph.xAxis()).toBeDefinedAndNotNull();
    });

    it('sets default Y-Axis', function () {
      expect(testGraph.yAxis()).toBeDefinedAndNotNull();
    });

    describe('config()', function () {
      var config;

      beforeEach(function (){
        config = testGraph.config();
      });

      it('has default marginTop', function () {
        expect(testGraph.config().marginTop).toBe(defaults.marginTop);
      });

      it('has default marginRight', function () {
        expect(config.marginRight).toBe(defaults.marginRight);
      });

      it('has default marginBottom', function () {
        expect(config.marginBottom).toBe(defaults.marginBottom);
      });

      it('has default marginLeft', function () {
        expect(config.marginLeft).toBe(defaults.marginLeft);
      });

      it('has default xScale set', function () {
        expect(config.xScale.toString()).toBe(d3.time.scale().toString());
      });

      it('has default yScale set', function () {
        expect(config.yScale.toString()).toEqual(d3.scale.linear().toString());
      });

      it('has default showLegend set', function () {
        expect(config.showLegend).toBe(true);
      });

    });

    describe('data()', function () {
      var dataWithAccessors, accessor;

      beforeEach(function() {
        accessor = {
          x: function (d) { return d.x + 2; },
          y: function (d) { return d.y + 2; }
        };

        dataWithAccessors = [{
          id:'dataWithAccessors',
          data: [
            { x: 13, y: 106},
            { x: 15, y: 56},
            { x: 17, y: 100}
          ],
          x: accessor.x,
          y: accessor.y
        }];

      });

      it('gets/sets data', function() {
        testGraph.data(fakeData);
        expect(testGraph.data()).toEqual(fakeData);
      });

      it('appends data when object is passed', function() {
        testGraph.data(fakeData);
        expect(testGraph.data().length).toBe(1);
        testGraph.data({
          id:'moreFakeData',
          data: [
            {'x':13, 'y':106},
            {'x':15, 'y':56},
            {'x':17, 'y':100}
          ]
        });
        expect(testGraph.data().length).toBe(2);
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
        expect(data.x).toBe(accessor.x);

      });

      it('sets provided y accessor function', function() {
        var data;
        testGraph.data(dataWithAccessors);
        data = testGraph.data('dataWithAccessors');
        expect(data.y).toBe(accessor.y);
      });

      it('updates object if id already exists', function() {
        var data, xAccessor;
        testGraph.data(dataWithAccessors);
        xAccessor = function (d) {
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

    describe('appendData()', function () {
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

    describe('component()', function () {
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

    describe('update()', function () {
      var selection, panel;

      beforeEach(function () {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        testGraph.update();
        panel = selection.select('svg');
      });

      it('calls domain for xScale', function () {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for xScale', function () {
        expect(xScale.domain().toString()).toBe(
          'Tue Jan 29 2013 17:13:34 GMT-0800 (PST),' +
          'Mon Feb 04 2013 17:13:34 GMT-0800 (PST)'
        );
      });

      it('updates domain for xScale based on domain interval period(days)',
        function () {
          testGraph.config({
            domainIntervalUnit: d3.time.day,
            domainIntervalPeriod: 2
          });
          testGraph.update();
          expect(xScale.domain().toString()).toBe(
            'Sat Feb 02 2013 17:13:34 GMT-0800 (PST),' +
            'Mon Feb 04 2013 17:13:34 GMT-0800 (PST)'
          );
        }
      );

      it('updates domain for xScale based on domain interval period(week)',
        function () {
          testGraph.config({
            domainIntervalUnit: d3.time.week,
            domainIntervalPeriod: 1
          });
          testGraph.update();
          expect(xScale.domain().toString()).toBe(
            'Tue Jan 29 2013 17:13:34 GMT-0800 (PST),' +
            'Mon Feb 04 2013 17:13:34 GMT-0800 (PST)'
          );
        }
      );

      it('updates domain for yScale', function () {
        expect(yScale.domain()).toEqual([56, 200]);
      });

      it('updates domain for based on force property the config', function () {
        testGraph.config({
          forceY: [0]
        });
        testGraph.update();
        expect(yScale.domain()).toEqual([0, 200]);
      });

      it('calls domain for yScale', function () {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('updates the xScale based on domain Interval', function () {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('calls update on legend component', function () {
        expect(legend.update).toHaveBeenCalled();
      });

      it('calls update on y-axis component', function () {
        expect(yAxis.update).toHaveBeenCalled();
      });

      it('calls update on test component', function () {
        expect(testComponent.update).toHaveBeenCalled();
      });

    });

    describe('render()', function () {
      var selection, panel;

      beforeEach(function () {
        setGraph();
        setSpies();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
        panel = selection.select('svg');
      });

      it('loads assets via the asset loader', function() {
        expect(assetLoader.loadAll).toHaveBeenCalledOnce();
      });

      it('adds legend', function () {
         expect(testGraph.legend()).toBeDefinedAndNotNull();
      });

      it('renders svg node', function () {
        expect(panel.node().nodeName.toLowerCase()).toBe('svg');
      });

      it('renders defs node', function () {
        var defs = panel.select('defs');
        expect(defs.node().nodeName.toLowerCase()).toBe('defs');
      });

      it('renders unframed components group', function () {
        var group = panel.select('.gl-unframed');
        expect(group.node().nodeName.toLowerCase()).toBe('g');
      });

      it('renders framed components group', function () {
        var group = panel.select('.gl-framed');
        expect(group.node().nodeName.toLowerCase()).toBe('g');
      });

      it('updates domain for xScale', function () {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for yScale', function () {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('updates legend', function () {
        expect(legend.update).toHaveBeenCalled();
      });

      it('updates legend keys', function () {
        expect(legend.config().keys).toBeDefinedAndNotNull();
      });

      it('calls render on test component', function () {
        expect(testComponent.render).toHaveBeenCalled();
      });

      it('calls render on legend component', function () {
        expect(legend.render).toHaveBeenCalled();
      });

      it('calls render on x-axis component', function () {
        expect(xAxis.render).toHaveBeenCalled();
      });

      it('calls render on y-axis component', function () {
        expect(yAxis.render).toHaveBeenCalled();
      });

      //TODO: tests for the layout of components.
      //dependency layout manager.

    });

    describe('toggleLoading()', function() {
      var selection;

      beforeEach(function() {
        testGraph = graph();
        selection = jasmine.htmlFixture();
        testGraph.render(selection.node());
      });

      it('toggles the loader on', function() {
        testGraph.toggleLoading(true);
        expect(selection.selectAll('.gl-asset-spinner'))
          .not.toBeEmptySelection();
      });

      it('toggles the loader off', function() {
        testGraph.toggleLoading(true);
        testGraph.toggleLoading(false);
        expect(selection.selectAll('.gl-asset-spinner').empty()).toBe(true);
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

    describe('hide()', function () {
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

    describe('show()', function () {
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

  });

});
