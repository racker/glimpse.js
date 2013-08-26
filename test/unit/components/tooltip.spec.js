define([
  'components/tooltip',
  'data/collection'
],
function(tooltip, dc) {
  'use strict';

  describe('components.tooltip', function() {

    var testtooltip, testData, selection,
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
          y: function(d) { return d.y; },
          tooltip: function(d) { return 'x: ' + d.x; }
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
          tooltip: function(d) { return 'x: ' + d.x; },
          color: function(d) { return d.color; }
        }
      }];
    }

    function setData(d, id) {
      dataCollection.add(d || testData);
      testtooltip.data(dataCollection);
      testtooltip.config({ 'dataId': id || 'fakeData' });
    }

    beforeEach(function(){
      testData = getTestData()[0];
      selection = jasmine.svgFixture();
      testtooltip = tooltip();
      dataCollection = dc.create();
      handlerSpy = jasmine.createSpy();
    });

    it('has has convenience functions', function() {
      expect(testtooltip).toHaveProperties(
        'cid',
        'color',
        'opacity',
        'rootId',
        'data',
        'render',
        'update',
        'root',
        'destroy',
        'show',
        'hide'
      );
    });

    describe('config()', function() {
      var config, defaults;

      defaults = {
        cid: null,
        opacity: 0.95
      };

      beforeEach(function(){
        config = testtooltip.config();
      });

      it('has default cid', function() {
        expect(config.cid).toBe(defaults.cid);
      });

      it('has default opacity', function() {
        expect(config.opacity).toBe(defaults.opacity);
      });

      it('has default strokeWidth', function() {
        expect(config.strokeWidth).toBe(defaults.strokeWidth);
      });

    });

    describe('data()', function() {

      it('sets/gets the data on the tooltip', function() {
        setData();
        expect(testtooltip.data()).toBe(testData);
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        setData();
        spyOn(testtooltip, 'update').andCallThrough();
        testtooltip.on('render', handlerSpy);
        testtooltip.config('color', 'green');
        testtooltip.render(selection);
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('appends the root element', function() {
        var root = selection.select('g').node();
        expect(root.nodeName).toBe('g');
      });

      it('applies the correct css classes to the root', function() {
        var root = testtooltip.root().node();
        expect(root).toHaveClasses('gl-component', 'gl-tooltip');
      });

      // Does not call update except on tooltip-show event.
      //it('calls the update function', function() {
        //expect(testtooltip.update).toHaveBeenCalled();
      //});

    });

    describe('root()', function() {

      it('gets the root element', function() {
        setData();
        testtooltip.render(selection);
        expect(testtooltip.root().node()).toBe(selection.node().firstChild);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        setData();
        testtooltip.render(selection);
        testtooltip.on('destroy', handlerSpy);
        testtooltip.destroy();
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
        testtooltip.render(selection);
        testtooltip.config({
          color: 'red',
          opacity: 0.5
        });
        testtooltip.on('update', handlerSpy);
        dataCollection.add(getTestData()[1]);
        testtooltip.data(dataCollection);
        testtooltip.update();
        root = selection.select('g');
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('adds tooltip fixture', function() {
        expect(root.select('.gl-tooltip-content').node()).toBeDefined();
      });

      it('adds opacity', function() {
        expect(root.select('.gl-tooltip-bg').style('opacity')).toBeDefined();
      });

      // TODO: Add all config attribute checks

      it('updates the fill attribute', function() {
        expect(root.select('.gl-tooltip-bg').attr('fill')).toBe('#f0f4f7');
      });

      //it('updates the opacity attribute', function() {
        //var bg = root.select('.gl-tooltip-bg').node();
        //expect(bg).toHaveStyle('opacity', '0.5');
      //});

      //it('updates the class attribute', function() {
        //var circle = root.select('circle').node();
        //expect(circle).toHaveAttr('class', 'gl-tooltip-point');
      //});

      //it('updates the color', function() {
        //var circle;
        //testtooltip.config({ 'dataId': 'fakeData2' });
        //testtooltip.update();
        //circle = root.select('circle').node();
        //expect(circle).toHaveAttr('fill', 'blue');
      //});

    });

  });

});
