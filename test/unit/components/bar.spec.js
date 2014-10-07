define([
  'components/bar',
  'data/collection'
],
function(bar, dc) {
  'use strict';

  describe('components.bar', function() {

    var testBar, testData, selection,
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
      }];
    }

    function setData(d, id) {
      dataCollection.add(d || testData);
      testBar.data(dataCollection);
      testBar.config({ 'dataId': id || 'fakeData' });
      testBar.xScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
      testBar.yScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
    }

    beforeEach(function(){
      testData = getTestData();
      selection = jasmine.svgFixture();
      testBar = bar();
      dataCollection = dc.create();
      handlerSpy = jasmine.createSpy();
    });

    it('has has convenience functions', function() {
      expect(testBar).toHaveProperties(
        'cid',
        'xScale',
        'yScale',
        'color',
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
        color: null,
        scaleWidth: true
      };

      beforeEach(function(){
        config = testBar.config();
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

      it('has default scaleWidth', function() {
        expect(config.scaleWidth).toBe(defaults.scaleWidth);
      });

    });

    describe('data()', function() {

      it('sets/gets the data on the bar', function() {
        setData();
        expect(testBar.data()).toBe(testData[0]);
      });

    });

    describe('xScale()', function() {

      it('sets/gets the xScale', function() {
        var xScale = d3.time.scale();
        testBar.xScale(xScale);
        expect(testBar.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function() {

      it('sets/gets the yScale', function() {
        var yScale = d3.scale.linear();
        testBar.yScale(yScale);
        expect(testBar.yScale()).toBe(yScale);
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        setData();
        spyOn(testBar, 'update').andCallThrough();
        testBar.on('render', handlerSpy);
        testBar.config('color', 'green');
        testBar.render(selection);
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('appends the root element', function() {
        var root = selection.select('g').node();
        expect(root.nodeName).toBe('g');
      });

      it('applies the correct css classes to the root', function() {
        var root = testBar.root().node();
        expect(root).toHaveClasses('gl-component', 'gl-bar');
      });

      it('appends rect to the root element', function() {
        var rect = selection.select('rect').node();
        expect(rect).not.toBeNull();
      });

      it('sets the path fill attribute', function() {
        var rect = testBar.root().select('rect').node();
        expect(rect).toHaveAttr('fill', testBar.color());
      });

      it('calls the update function', function() {
        expect(testBar.update).toHaveBeenCalled();
      });

    });

    describe('root()', function() {

      it('gets the root element', function() {
        setData();
        testBar.render(selection);
        expect(testBar.root().node()).toBe(selection.node().firstChild);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        setData();
        testBar.render(selection);
        testBar.on('destroy', handlerSpy);
        testBar.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

    describe('update()', function() {
      var rect;

      beforeEach(function(){
        setData();
        testBar.render(selection);
        testBar.config({
          cssClass: 'foo',
          color: 'red',
          opacity: 0.5
        });
        setData();
        testBar.on('update', handlerSpy);
        testBar.update();
        rect = selection.select('.gl-data-bar').node();
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('updates the css class', function() {
        expect(testBar.root().node())
          .toHaveClasses('gl-component', 'gl-bar', 'foo');
      });

      it('updates the fill attribute', function() {
        expect(rect).toHaveAttr('fill', 'red');
      });

      it('updates the opacity attribute', function() {
        expect(rect).toHaveAttr('opacity', '0.5');
      });

    });
  });

});