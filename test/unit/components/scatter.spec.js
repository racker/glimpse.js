define([
  'components/scatter',
  'data/collection'
],
function(scatter, dc) {
  'use strict';

  describe('components.scatter', function() {

    var testScatter, testData, selection,
        dataCollection, handlerSpy;

    function getTestData() {
      return [{
        id:'fakeData',
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 50 },
          { x: 2, y: 100 },
          { x: 3, y: 75 }
        ],
        dimensions: {
          x: function(d) { return d.x; },
          y: function(d) { return d.y; }
        }
      },
      {
        id:'fakeData2',
        data: [
          { x: 0, y: 0, color: 'blue', r: 10 },
          { x: 1, y: 50, color: 'red', r: 12 },
          { x: 2, y: 100, color: 'purple', r: 15 }
        ],
        dimensions: {
          x: function(d) { return d.x; },
          y: function(d) { return d.y; },
          r: function(d) { return d.r; },
          color: function(d) { return d.color; }
        }
      }];
    }

    function setData(d, id) {
      dataCollection.add(d || testData);
      testScatter.data(dataCollection);
      testScatter.config({ 'dataId': id || 'fakeData' });
      testScatter.xScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
      testScatter.yScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
    }

    beforeEach(function(){
      testData = getTestData()[0];
      selection = jasmine.svgFixture();
      testScatter = scatter();
      dataCollection = dc.create();
      handlerSpy = jasmine.createSpy();
    });

    it('has has convenience functions', function() {
      expect(testScatter).toHaveProperties(
        'cid',
        'xScale',
        'yScale',
        'color',
        'opacity',
        'radius',
        'rootId',
        'data',
        'render',
        'update',
        'root',
        'destroy',
        'show',
        'hide',
        'rootId'
      );
    });

    describe('config()', function() {
      var config, defaults;

      defaults = {
        cid: null,
        xScale: null,
        yScale: null,
        color: '#333',
        inLegend: true,
        opacity: 0.4,
        radius: 6,
        strokeWidth: 1.5
      };

      beforeEach(function(){
        config = testScatter.config();
      });

      it('has default cid', function() {
        expect(config.cid).toBe(defaults.cid);
      });

      it('has default xScale', function() {
        expect(config.xScale).toBe(defaults.xScale);
      });

      it('has default yScale', function() {
        expect(config.yScale).toBe(defaults.yScale);
      });

      it('has default color', function() {
        expect(config.color).toBe(defaults.color);
      });

      it('has default inLegend', function() {
        expect(config.inLegend).toBe(defaults.inLegend);
      });

      it('has default opacity', function() {
        expect(config.opacity).toBe(defaults.opacity);
      });

      it('has default radius', function() {
        expect(config.radius).toBe(defaults.radius);
      });

      it('has default strokeWidth', function() {
        expect(config.strokeWidth).toBe(defaults.strokeWidth);
      });

    });

    describe('data()', function() {

      it('sets/gets the data on the scatter', function() {
        setData();
        expect(testScatter.data()).toBe(testData);
      });

    });

    describe('xScale()', function() {

      it('sets/gets the xScale', function() {
        var xScale = d3.time.scale();
        testScatter.xScale(xScale);
        expect(testScatter.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function() {

      it('sets/gets the yScale', function() {
        var yScale = d3.scale.linear();
        testScatter.yScale(yScale);
        expect(testScatter.yScale()).toBe(yScale);
      });

    });

    describe('handleDataToggle()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        testScatter.render('#svg-fixture');
      });

      it('toggles the line to hide in data tag is inactive', function() {
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testScatter.root().node()).toHaveAttr('display', 'none');
      });

      it('toggles the line to show after checking data tag', function() {
        dataCollection.addTags('fakeData', 'inactive');
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testScatter.root().node()).not.toHaveAttr('display', 'none');
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        setData();
        spyOn(testScatter, 'update').andCallThrough();
        testScatter.dispatch.on('render', handlerSpy);
        testScatter.config('color', 'green');
        testScatter.render(selection);
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('appends the root element', function() {
        var root = selection.select('g').node();
        expect(root.nodeName).toBe('g');
      });

      it('applies the correct css classes to the root', function() {
        var root = testScatter.root().node();
        expect(root).toHaveClasses('gl-component', 'gl-scatter');
      });

      it('calls the update function', function() {
        expect(testScatter.update).toHaveBeenCalled();
      });

    });

    describe('root()', function() {

      it('gets the root element', function() {
        setData();
        testScatter.render(selection);
        expect(testScatter.root().node()).toBe(selection.node().firstChild);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        setData();
        testScatter.render(selection);
        testScatter.dispatch.on('destroy', handlerSpy);
        testScatter.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

    describe('update()', function() {
      var root;

      beforeEach(function(){
        setData();
        testScatter.render(selection);
        testScatter.config({
          cssClass: 'foo',
          color: 'red',
          opacity: 0.5
        });
        testScatter.dispatch.on('update', handlerSpy);
        dataCollection.add(getTestData()[1]);
        testScatter.data(dataCollection);
        testScatter.update();
        root = selection.select('g');
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('adds one circle per data point', function() {
        var circles = root.selectAll('circle');
        expect(circles[0].length).toBe(4);
      });

      it('updates the fill attribute', function() {
        var circle = root.select('circle').node();
        expect(circle).toHaveAttr('fill', 'red');
      });

      it('updates the opacity attribute', function() {
        var circle = root.select('circle').node();
        expect(circle).toHaveAttr('opacity', '0.5');
      });

      it('updates the class attribute', function() {
        var circle = root.select('circle').node();
        expect(circle).toHaveAttr('class', 'gl-scatter-point');
      });

      it('updates the number of circles if data is updated', function() {
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        expect(root.selectAll('circle')[0].length).toBe(3);
      });

      it('sets the radius for element if specified', function() {
        var circle;
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        circle = root.select('circle').node();
        expect(circle).toHaveAttr('r', 10);
      });

      it('sets the color for element if specified', function() {
        var circle;
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        circle = root.select('circle').node();
        expect(circle).toHaveAttr('fill', 'blue');
      });

    });

  });

});