define([
  'components/tooltip',
  'data/collection',
  'events/pubsub'
],
function(tooltip, dc, pubsub) {
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
      testtooltip.config({
        'rootId': 'foo'
      });
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
        opacity: 0.95,
        message: '',
        visible: false,
        x: 100,
        y: 100,
        zIndex: 50,
        strokeColor:  '#4c9acc',
        fillColor: '#f0f4f7',
        padding: 10,
        hiddenStates: ['empty', 'loading', 'error']
      };

      beforeEach(function(){
        config = testtooltip.config();
      });

      it('has default opacity', function() {
        expect(config.opacity).toBe(defaults.opacity);
      });

      it('has default message', function() {
        expect(config.message).toBe(defaults.message);
      });

      it('has default visible', function() {
        expect(config.visible).toBe(defaults.visible);
      });

      it('has default x', function() {
        expect(config.x).toBe(defaults.x);
      });

      it('has default y', function() {
        expect(config.y).toBe(defaults.y);
      });

      it('has default zIndex', function() {
        expect(config.zIndex).toBe(defaults.zIndex);
      });

      it('has default strokeColor', function() {
        expect(config.strokeColor).toBe(defaults.strokeColor);
      });

      it('has default fillColor', function() {
        expect(config.fillColor).toBe(defaults.fillColor);
      });

      it('has default padding', function() {
        expect(config.padding).toBe(defaults.padding);
      });

      it('has default hiddenStates', function() {
        expect(config.hiddenStates).toEqual(defaults.hiddenStates);
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

      //Does not call update except on tooltip-show event.
      it('does not call the update function', function() {
        expect(testtooltip.update).not.toHaveBeenCalled();
      });

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
      var root, content, textMessages, rect;

      beforeEach(function(){
        setData();
        testtooltip.render(selection);
        testtooltip.config({
          color: 'red',
          opacity: 0.5,
          'message': 'x: 5\ny: 10'
        });
        spyOn(testtooltip, 'show').andCallThrough();
        spyOn(testtooltip, 'applyZIndex').andCallThrough();
        testtooltip.on('update', handlerSpy);
        dataCollection.add(getTestData()[1]);
        testtooltip.data(dataCollection);
        testtooltip.update();
        root = selection.select('g');
        content = root.select('.gl-tooltip-content');
        rect = root.select('.gl-tooltip-bg');
        textMessages = content.node().childNodes;
      });

      it('calls show method on tooltip', function() {
        expect(testtooltip.show).toHaveBeenCalled();
      });

      it('adds tooltip fixture', function() {
        expect(root.select('.gl-tooltip-content').node()).toBeDefined();
      });

      it('adds one text node per message', function() {
        expect(textMessages.length).toBe(2);
      });

      it('adds right message', function() {
        expect(textMessages[0].textContent).toBe('x: 5');
        expect(textMessages[1].textContent).toBe('y: 10');
      });

      it('sets the x co-ordinate of message to 0', function() {
        expect(textMessages[0]).toHaveAttr('x', 0);
        expect(textMessages[1]).toHaveAttr('x', 0);
      });

      it('adds opacity', function() {
        expect(rect.style('opacity')).toBeDefined();
      });

      it('updates the fill attribute', function() {
        expect(rect.attr('fill')).toBe('#f0f4f7');
      });

      it('sets width on the tooltip rect', function() {
        expect(rect.node())
          .toHaveAttr(
            'width',
            content.size()[0] + testtooltip.config().padding);
      });

      it('sets height on the tooltip rect', function() {
        expect(rect.node())
          .toHaveAttr(
            'height',
            content.size()[1] + testtooltip.config().padding);
      });

      it('calls applyZIndex method on tooltip', function() {
        expect(testtooltip.applyZIndex).toHaveBeenCalled();
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

    });

    describe('tooltip-show event', function() {
      //TODO:Write tests for tooltip calculations.

    });

    describe('tooltip-hide event', function() {
      var pubsubModule;

      beforeEach(function() {
        spyOn(testtooltip, 'hide');
        pubsubModule = pubsub.getSingleton();
        setData();
        testtooltip.render(selection);
      });

      it('calls hide on tooltip', function() {
        pubsubModule.pub('foo:tooltip-hide');
        expect(testtooltip.hide).toHaveBeenCalled();
      });

    });

  });

});
