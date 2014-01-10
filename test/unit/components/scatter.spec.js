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
        strokeWidth: 1.5,
        showTransition: false,
        preTransitionRadius: 5,
        preTransitionColor: '#333',
        delay: 100,
        duration: 1000,
        ease: 'linear',
        highlightRadius: 4,
        highlightFill: '#fff',
        highlightStrokeWidth: 2,
        showTooltip: true,
        showHighlight: true
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

      it('has default showTransition', function() {
        expect(config.showTransition).toBe(defaults.showTransition);
      });

      it('has default preTransitionRadius', function() {
        expect(config.preTransitionRadius).toBe(defaults.preTransitionRadius);
      });
      it('has default preTransitionColor', function() {
        expect(config.preTransitionColor).toBe(defaults.preTransitionColor);
      });

      it('has default delay', function() {
        expect(config.delay).toBe(defaults.delay);
      });

      it('has default duration', function() {
        expect(config.duration).toBe(defaults.duration);
      });

      it('has default ease', function() {
        expect(config.ease).toBe(defaults.ease);
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
        testScatter.on('render', handlerSpy);
        testScatter.config({'color': 'green', 'showHighlight': false});
        spyOn(testScatter, 'highlight');
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

      it('does not call highlight if showHighlight is set to false',
        function() {
          expect(testScatter.highlight).not.toHaveBeenCalled();
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
        testScatter.on('destroy', handlerSpy);
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
        testScatter.config('showHighlight', false);
        testScatter.render(selection);
        testScatter.config({
          cssClass: 'foo',
          color: 'red',
          opacity: 0.5,
          showHighlight: true
        });
        testScatter.on('update', handlerSpy);
        dataCollection.add(getTestData()[1]);
        testScatter.data(dataCollection);
        spyOn(testScatter, 'highlight');
        spyOn(testScatter, 'pubsubHighlightEvents');
        testScatter.update();
        root = selection.select('g');
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('adds one circle per data point', function() {
        var circles = root.selectAll('.gl-scatter-point');
        expect(circles[0].length).toBe(4);
      });

      it('updates the fill attribute', function() {
        var circle = root.select('.gl-scatter-point').node();
        expect(circle).toHaveAttr('fill', 'red');
      });

      it('updates the opacity attribute', function() {
        var circle = root.select('.gl-scatter-point').node();
        expect(circle).toHaveAttr('opacity', '0.5');
      });

      it('updates the class attribute', function() {
        var circle = root.select('.gl-scatter-point').node();
        expect(circle).toHaveAttr('class', 'gl-scatter-point');
      });

      it('updates the number of circles if data is updated', function() {
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        expect(root.selectAll('.gl-scatter-point')[0].length).toBe(3);
      });

      it('sets the radius for element if specified', function() {
        var circle;
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        circle = root.select('.gl-scatter-point').node();
        expect(circle).toHaveAttr('r', 10);
      });

      it('sets the color for element if specified', function() {
        var circle;
        testScatter.config({ 'dataId': 'fakeData2' });
        testScatter.update();
        circle = root.select('.gl-scatter-point').node();
        expect(circle).toHaveAttr('fill', 'blue');
      });

      it('calls the highlight method when showHighlight is true', function() {
        expect(testScatter.highlight).toHaveBeenCalled();
      });

      it('calls the pubsubHighlightEvents method when showHighlight is true',
        function() {
          expect(testScatter.pubsubHighlightEvents).toHaveBeenCalled();
      });

    });

    describe('applyTransition()', function() {
      var root;

      beforeEach(function() {
        setData();
        dataCollection.add(getTestData()[1]);
        spyOn(testScatter, 'applyTransition').andCallThrough();
        testScatter.render(selection);
        root = selection.select('g');
      });

      it('does not call applyTransition by default', function() {
        expect(testScatter.applyTransition).not.toHaveBeenCalled();
      });

      it('applies default color and radius if showTransition is false',
        function() {
          var circle = root.select('.gl-scatter-point').node();
          expect(circle).toHaveAttr({'fill':'#333', 'r': 6 } );
      });

      it('calls applyTransition if showTranstion is set to true',
        function() {
          testScatter.config({'showTransition': true});
          testScatter.update();
          expect(testScatter.applyTransition).toHaveBeenCalled();
      });

      it('applies transition color and radius', function() {
        var circle = null;
        runs(function () {
          testScatter.config({
            'dataId': 'fakeData2',
            'showTransition': true,
            delay: 50,
            duration: 100
          });
          testScatter.update();
        });
        waits(200);
        runs(function () {
          circle = root.selectAll('.gl-scatter-point');
          expect(circle.node()).toHaveAttr({'r': 10, 'fill': '#0000ff'});
        });
      });

    });

  });

});
