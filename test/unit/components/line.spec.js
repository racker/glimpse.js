define([
  'd3',
  'core/object',
  'components/line',
  'data/collection'
],
function(d3, object, line, dc) {
  'use strict';

  describe('components.line', function() {

    var testLine, data, dataCollection, handlerSpy;

    data = [{
      id:'fakeData',
      data: [
        { x: 13, y: 106},
        { x: 15, y: 56},
        { x: 17, y: 100}
      ],
      dimensions: {
        x: function(d) { return d.x + 1; },
        y: function(d) { return d.y + 1; }
      }
    }];

    function setData(d, id) {
      dataCollection.add(d || data);
      testLine.data(dataCollection);
      testLine.config({'dataId': id || 'fakeData', color: 'steelBlue'});
    }

    function setScales() {
      testLine.xScale(d3.time.scale());
      testLine.yScale(d3.scale.linear());
    }

    beforeEach(function(){
      dataCollection = dc.create();
      spyOn(object, 'extend').andCallThrough();
      testLine = line();
      handlerSpy = jasmine.createSpy();
    });

    afterEach(function(){
      testLine = null;
    });

    it('has required set of properties', function() {
      expect(testLine).toHaveProperties(
        'cid',
        'xScale',
        'yScale',
        'data',
        'lineGenerator',
        'show',
        'hide',
        'destroy'
      );
    });

    describe('config()', function() {
      var config, defaults;

      defaults = {
        strokeWidth: 1.5,
        color: 'steelBlue',
        inLegend: true,
        lineGenerator: d3.svg.line(),
        interpolate: 'linear'
      };

      beforeEach(function(){
        config = testLine.config();
      });

      it('has default strokeWidth', function() {
        expect(config.strokeWidth).toBe(defaults.strokeWidth);
      });

      it('has default inLegend', function () {
        expect(config.inLegend).toBe(defaults.inLegend);
      });

      it('has default lineGenerator', function() {
        expect(config.lineGenerator.toString())
        .toBe(defaults.lineGenerator.toString());
      });

      it('has default interpolate', function() {
        expect(config.interpolate).toBe(defaults.interpolate);
      });

    });

    describe('data()', function() {

      it('sets/gets the data on the line', function() {
        setData();
        expect(testLine.data()).toBe(data[0]);
      });

    });

    describe('line generator', function() {
      var lineGenerator,
        mockScale,
        selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        lineGenerator = testLine.lineGenerator();
        mockScale = d3.scale.linear();
        setData();
        testLine.xScale(d3.scale.linear());
        testLine.yScale(d3.scale.linear());
        testLine.render('#svg-fixture');
      });

      it('applies the data config X accessor fn', function() {
        expect(lineGenerator.x()({ x: 1 })).toBe(2);
      });

      it('applies the data config Y accessor', function() {
        expect(lineGenerator.y()({ y: 1 })).toBe(2);
      });

    });

    describe('xScale()', function() {

      it('sets/gets the xScale', function() {
        var xScale = d3.time.scale();
        testLine.xScale(xScale);
        expect(testLine.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function() {

      it('sets/gets the yScale', function() {
        var yScale = d3.scale.linear();
        testLine.yScale(yScale);
        expect(testLine.yScale()).toBe(yScale);
      });

    });

    describe('update()', function() {
      var selection, path;

      beforeEach(function(){
        selection = jasmine.svgFixture();
        setData();
        setScales();
        testLine.render('#svg-fixture');
        testLine.dispatch.on('update', handlerSpy);
        testLine.update();
        path = selection.select('path').node();
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('configures the lineGenerator', function() {
        expect(testLine.lineGenerator()).toBeDefinedAndNotNull();
      });

      it('configures x on lineGenerator', function() {
        expect(testLine.lineGenerator().x).toBeDefinedAndNotNull();
      });

      it('configures y on lineGenerator', function() {
        expect(testLine.lineGenerator().y).toBeDefinedAndNotNull();
      });

      it('adds attribute fill', function() {
        expect(path).toHaveAttr('fill', 'none');
      });

      it('adds attribute stroke with configured color value',
        function() {
          expect(path).toHaveAttr('stroke', testLine.config('color'));
        }
      );

      it('adds attribute stroke-width with configured stroke-width value',
        function() {
          expect(path).toHaveAttr(
            'stroke-width', testLine.config('strokeWidth')
          );
        }
      );

    });

    describe('render()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        spyOn(testLine, 'update');
        testLine.dispatch.on('render', handlerSpy);
        testLine.render('#svg-fixture');
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('appends group element to the selection', function() {
        var group = selection.select('g').node();
        expect(group.nodeName.toLowerCase()).toBe('g');
      });

      it('appends path to the root element', function() {
          var path = selection.select('path').node();
          expect(path).not.toBeNull();
        }
      );

      it('sets a class on path to the root element', function() {
          var path = selection.select('path').node();
          expect(path).toHaveClasses('gl-path');
        }
      );

      it('calls the update function', function() {
        expect(testLine.update).toHaveBeenCalled();
      });

    });

    describe('destroy()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        spyOn(testLine, 'update');
        testLine.render(selection);
        testLine.dispatch.on('destroy', handlerSpy);
        testLine.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

    describe('root()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        testLine.render(selection);
      });

      it('gets the root element', function() {
        var firstChild = selection.node().firstChild;
        expect(testLine.root().node()).toBe(firstChild);
      });

    });

    describe('no data', function() {
      var selection, exceptionCaught;

      beforeEach(function() {
        exceptionCaught = false;
        selection = jasmine.svgFixture();
        try {
          testLine.render(selection);
        }
        catch(e) {
          exceptionCaught = true;
        }
      });

      it('returns graceully with no data', function() {
        expect(exceptionCaught).toBe(false);
      });

    });

  });

});
