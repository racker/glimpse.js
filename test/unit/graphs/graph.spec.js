define([
  'graphs/graph',
  'core/asset-loader'
],
function (graph, assetLoader) {
  'use strict';

  describe('graphs.graph', function () {
    var testGraph,
      defaults,
      fakeData,
      testComponent,
      xAxis,
      yAxis,
      legend,
      xScale,
      yScale;

    defaults = {
      marginTop: 10,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 0
    };

    fakeData = [{
      id:'fakeData',
      data: [
        {'x':13, 'y':106},
        {'x':15, 'y':56},
        {'x':17, 'y':100}
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
        .component({ id: 'testComponent', type: 'line', dataId: 'fakeData' })
        .xAxis({ id: 'xAxis' })
        .yAxis({ id: 'yAxis' })
        .legend({ id: 'legend' });
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
      spyOn(xScale, 'domain');
      spyOn(yScale, 'domain');
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

      it('gets/sets data', function() {
        testGraph.data(fakeData);
        expect(testGraph.data()).toEqual(fakeData);
      });

      it('appends data when object is based', function() {
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

    });

    describe('component()', function () {
      it('adds component', function() {
        testGraph.component({
          id: 'testComponent',
          type: 'line',
          dataId: 'fakeData'
        });
        expect(testGraph.getComponents().length).toBe(1);
      });

      it('returns a component when id is passed', function() {
        var line;
        testGraph.component({
          id: 'testComponent',
          type: 'line',
          dataId: 'fakeData'
        });
        line = testGraph.component('testComponent');
        expect(line).toBeDefinedAndNotNull();
      });

      it('updates the config on the component', function() {
        var line;
        testGraph.component({
          id: 'testComponent',
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

      it('updates domain for xScale', function () {
        expect(xScale.domain).toHaveBeenCalled();
      });

      it('updates domain for yScale', function () {
        expect(yScale.domain).toHaveBeenCalled();
      });

      it('calls update on legend component', function () {
        expect(legend.update).toHaveBeenCalled();
      });

      it('calls update on x-axis component', function () {
        expect(xAxis.update).toHaveBeenCalled();
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
        var group = panel.select('.gl-components.gl-unframed');
        expect(group.node().nodeName.toLowerCase()).toBe('g');
      });

      it('renders framed components group', function () {
        var group = panel.select('.gl-components.gl-framed');
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

  });

});
