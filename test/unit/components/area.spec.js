define([
  'components/area',
  'data/collection'
],
function(area, dc) {
  'use strict';

  describe('components.area', function() {

    var testArea, testData, selection, areaGenerator,
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
      testArea.data(dataCollection);
      testArea.config({ 'dataId': id || 'fakeData' });
      testArea.xScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
      testArea.yScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
    }

    beforeEach(function(){
      testData = getTestData();
      selection = jasmine.svgFixture();
      testArea = area();
      areaGenerator = testArea.areaGenerator();
      dataCollection = dc.create();
      handlerSpy = jasmine.createSpy();
    });

    it('has has convenience functions', function() {
      expect(testArea).toHaveProperties(
        'cid',
        'target',
        'xScale',
        'yScale',
        'color',
        'opacity',
        'cssClass',
        'areaGenerator',
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
        inLegend: true,
        areaGenerator: d3.svg.area(),
        opacity: 1,
        highlightRadius: 4,
        highlightFill: '#fff',
        highlightStrokeWidth: 2,
        showTooltip: false,
        showHighlight: true
      };

      beforeEach(function(){
        config = testArea.config();
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

      it('has default areaGenerator', function() {
        expect(config.areaGenerator.toString())
          .toBe(defaults.areaGenerator.toString());
      });

      it('has default opacity', function() {
        expect(config.opacity).toBe(defaults.opacity);
      });

      it('has default highlightRadius', function() {
        expect(config.highlightRadius).toBe(defaults.highlightRadius);
      });

      it('has default highlightFill', function() {
        expect(config.highlightFill).toBe(defaults.highlightFill);
      });

      it('has default highlightStrokeWidth', function() {
        expect(config.highlightStrokeWidth).toBe(defaults.highlightStrokeWidth);
      });

      it('has default showTooltip', function() {
        expect(config.showTooltip).toBe(defaults.showTooltip);
      });

       it('has default showHighlight', function() {
        expect(config.showHighlight).toBe(defaults.showHighlight);
      });

    });

    describe('data()', function() {

      it('sets/gets the data on the area', function() {
        setData();
        expect(testArea.data()).toBe(testData[0]);
      });

    });

    describe('area generator', function() {
      var accessor;

      beforeEach(function() {
        accessor = {
          x: function(d) { return d.x + 1; },
          y: function(d) { return d.y + 2; },
          y0: function() { return 5; }
        };
        testData[0].dimensions.x = accessor.x;
        testData[0].dimensions.y = accessor.y;
        setData();
        testArea.render(selection);
      });

      function createArea(data) {
        var a = area(),
            d = dc.create();
        d.add(data);
        a.data(d);
        a.config({ 'dataId': 'fakeData' });
        a.xScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
        a.yScale(d3.scale.linear().domain([0, 100]).range([0, 100]));
        a.render(selection);
        return a;
      }

      function getDataAttribute(comp) {
        return d3.select(comp.root().node().childNodes[0]).attr('d');
      }

      it('applies the data config X accessor fn', function() {
        expect(areaGenerator.x()({ x: 1 })).toBe(2);
      });

      it('applies the data config Y accessor', function() {
        expect(areaGenerator.y()({ y: 1 })).toBe(3);
      });

      it('applies the Y baseline offset with the Y accessor', function() {
        testData[0].dimensions.y0 = accessor.y0;
        setData();
        testArea.update();
        // y + 2 + 5
        expect(areaGenerator.y()({ y: 1 })).toBe(8);
      });

      it('renders null values as 0s', function() {
        var d1 = getTestData(), d2 = getTestData(), a1, a2;
        d1[0].data[0].x = 0;
        d1[0].data[0].y = 0;
        a1 = createArea(d1);
        d2[0].data[0].x = null;
        d2[0].data[0].y = null;
        a2 = createArea(d2);
        expect(getDataAttribute(a1))
          .toBe('M0,0L1,50L2,100L3,75L3,0L2,0L1,0L0,0Z');
        expect(getDataAttribute(a1)).toBe(getDataAttribute(a2));
      });

    });

    describe('xScale()', function() {

      it('sets/gets the xScale', function() {
        var xScale = d3.time.scale();
        testArea.xScale(xScale);
        expect(testArea.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function() {

      it('sets/gets the yScale', function() {
        var yScale = d3.scale.linear();
        testArea.yScale(yScale);
        expect(testArea.yScale()).toBe(yScale);
      });

    });

    describe('handleDataToggle()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        testArea.render('#svg-fixture');
      });

      it('toggles the line to hide in data tag is inactive', function() {
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testArea.root().node()).toHaveAttr('display', 'none');
      });

      it('toggles the line to show after checking data tag', function() {
        dataCollection.addTags('fakeData', 'inactive');
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testArea.root().node()).not.toHaveAttr('display', 'none');
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        setData();
        spyOn(testArea, 'update').andCallThrough();
        spyOn(testArea, 'highlight');
        testArea.on('render', handlerSpy);
        testArea.config({'color': 'green', 'showHighlight': false});
        testArea.render(selection);
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('appends the root element', function() {
        var root = selection.select('g').node();
        expect(root.nodeName).toBe('g');
      });

      it('applies the correct css classes to the root', function() {
        var root = testArea.root().node();
        expect(root).toHaveClasses('gl-component', 'gl-area');
      });

      it('appends path to the root element', function() {
          var path = selection.select('path').node();
          expect(path).not.toBeNull();
        }
      );

      it('sets a class on the path element', function() {
          var path = testArea.root().select('path').node();
          expect(path).toHaveClasses('gl-path');
        }
      );

      it('sets the path fill attribute', function() {
        var path = testArea.root().select('path').node();
        expect(path).toHaveAttr('fill', testArea.color());
      });

      it('sets the path fill attribute', function() {
        var path = testArea.root().select('path').node();
        expect(path).toHaveAttr('opacity', testArea.opacity());
      });

      it('calls the update function', function() {
        expect(testArea.update).toHaveBeenCalled();
      });

      it('does not call highlight if showHighlight is set to false',
        function() {
          expect(testArea.highlight).not.toHaveBeenCalled();
      });

      it('dies gracefully if no data is set', function() {
        var exceptionThrown = false;
        testArea = area();
        try {
          testArea.render(selection);
        } catch (e) {
          exceptionThrown = true;
        }
        expect(exceptionThrown).toBe(false);
      });

      it('dies gracefully if data is set but empty', function() {
        var exceptionThrown = false;
        dataCollection = dc.create();
        dataCollection.add({
          id: 'foo',
          data: []
        });
        testArea = area();
        testArea.data(dataCollection);
        try {
          testArea.render(selection);
        } catch (e) {
          exceptionThrown = true;
        }
        expect(exceptionThrown).toBe(false);
      });

    });

    describe('root()', function() {

      it('gets the root element', function() {
        setData();
        testArea.render(selection);
        expect(testArea.root().node()).toBe(selection.node().firstChild);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        setData();
        testArea.render(selection);
        testArea.on('destroy', handlerSpy);
        testArea.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });


    describe('update()', function() {
      var path;

      beforeEach(function(){
        setData();
        testArea.config('showHighlight', false);
        testArea.render(selection);
        testArea.config({
          cssClass: 'foo',
          color: 'red',
          opacity: 0.5
        });
        testData[0].dimensions.x = function(d) { return d.x + 1; };
        testData[0].dimensions.y = function(d) { return d.y + 2; };
        testData[0].dimensions.y0 = null;
        setData();
        testArea.on('update', handlerSpy);
        testArea.config('showHighlight', true);
        spyOn(testArea, 'highlight');
        spyOn(testArea, 'pubsubHighlightEvents');
        testArea.update();
        path = selection.select('path').node();
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('updates the areaGenerator x accessor', function() {
        expect(areaGenerator.x()({ x: 1 })).toBe(2);
      });

      it('updates the areaGenerator y accessor', function() {
        expect(areaGenerator.y()({ y: 1 })).toBe(3);
      });

      it('updates the css class', function() {
        expect(testArea.root().node())
          .toHaveClasses('gl-component', 'gl-area', 'foo');
      });

      it('updates the fill attribute', function() {
        expect(path).toHaveAttr('fill', 'red');
      });

      it('updates the opacity attribute', function() {
        expect(path).toHaveAttr('opacity', '0.5');
      });

      it('calls the highlight method when showHighlight is true', function() {
        expect(testArea.highlight).toHaveBeenCalled();
      });

      it('calls the pubsubHightlightEvents method when showHighlight is true',
        function() {
          expect(testArea.pubsubHighlightEvents).toHaveBeenCalled();
      });

    });

  });

});
