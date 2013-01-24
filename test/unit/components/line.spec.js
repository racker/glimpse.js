define([
  'd3',
  'core/object',
  'components/component'
],
function (d3, object, components) {
  'use strict';

  describe('components.line', function () {

    var testLine, data, defaults, x, y;

    data = [{
      id:'fakeData',
      data: [
        {"x":13,"y":106},
        {"x":15,"y":56},
        {"x":17,"y":100}
      ]
    }];

    function setData(d, id) {
      testLine.config({'dataId': id || 'fakeData'});
      testLine.data(d || data);
    }

    function setScales() {
      testLine.xScale(d3.time.scale());
      testLine.yScale(d3.scale.linear());
    }

    beforeEach(function (){
      spyOn(object, 'extend').andCallThrough();
      testLine = components.line();
    });

    afterEach(function (){
      testLine = null;
    });

    it('has required set of properties', function () {
      expect(testLine).toHaveProperties(
        'id',
        'xScale',
        'yScale',
        'data',
        'lineGenerator'
      );
    });

    describe('config()', function () {
      var config, defaults;

      defaults = {
        isFramed: true,
        strokeWidth: 1,
        color: 'steelBlue',
        showInLegend: true,
        lineGenerator: d3.svg.line(),
        interpolate: 'linear'
      };

      beforeEach(function (){
        config = testLine.config();
      });

      it('has default isFramed', function () {
        expect(config.isFramed).toBe(defaults.isFramed);
      });

      it('has default strokeWidth', function () {
        expect(config.strokeWidth).toBe(defaults.strokeWidth);
      });

      it('has default showInLegend', function () {
        expect(config.showInLegend).toBe(defaults.showInLegend);
      });

      it('has default lineGenerator', function () {
        expect(config.lineGenerator.toString())
        .toBe(defaults.lineGenerator.toString());
      });

      it('has default interpolate', function () {
        expect(config.interpolate).toBe(defaults.interpolate);
      });

    });

    describe('data()', function () {

      it('sets/gets the data on the line', function () {
        setData();
        expect(testLine.data()).toBe(data[0]);
      });

    });

    describe('line generator', function() {
      var lineGenerator,
        mockScale,
        dataConfig,
        selection,
        accessor;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        lineGenerator = testLine.lineGenerator();
        accessor = {
          x: function(d) { return d.x + 1; },
          y: function(d) { return d.y + 1; }
        };
        mockScale = function(d) { return d; };
        dataConfig = {
          id: 'fakeData',
          data: [{ x: 100, y: 200 }]
        };
        setData([dataConfig]);
        testLine.xScale(mockScale);
        testLine.yScale(mockScale);
        testLine.render(selection);
      });

      it('applies the default X accessor fn', function() {
        expect(lineGenerator.x()({ x: 1 })).toBe(1);
      });

      it('applies the data config X accessor fn when present', function() {
        dataConfig.x = accessor.x;
        testLine.update();
        expect(lineGenerator.x()({ x: 1 })).toBe(2);
      });

      it('applies the default Y accessor fn', function() {
        expect(lineGenerator.y()({ y: 1 })).toBe(1);
      });

      it('applies the data config X accessor fn when present', function() {
        dataConfig.y = accessor.y;
        testLine.update();
        expect(lineGenerator.y()({ y: 1 })).toBe(2);
      });

    });

    describe('xScale()', function () {

      it('sets/gets the xScale', function () {
        var xScale = d3.time.scale();
        testLine.xScale(xScale);
        expect(testLine.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function () {

      it('sets/gets the yScale', function () {
        var yScale = d3.scale.linear();
        testLine.yScale(yScale);
        expect(testLine.yScale()).toBe(yScale);
      });

    });

    describe('update()', function () {
      var selection, path, lineGenerator;

      beforeEach(function (){
        selection = jasmine.svgFixture();
        setData();
        setScales();
        testLine.render(selection);
        testLine.update();
        path = selection.select('path').node();
      });

      it('configures the lineGenerator', function () {
        expect(testLine.lineGenerator()).toBeDefinedAndNotNull();
      });

      it('configures x on lineGenerator', function () {
        expect(testLine.lineGenerator().x).toBeDefinedAndNotNull();
      });

      it('configures y on lineGenerator', function () {
        expect(testLine.lineGenerator().y).toBeDefinedAndNotNull();
      });

      it('adds attribute fill', function () {
        expect(path).toHaveAttr('fill', 'none');
      });

      it('adds attribute stroke with configured color value',
        function () {
          expect(path).toHaveAttr('stroke', testLine.config('color'));
        }
      );

      it('adds attribute stroke-width with configured stroke-width value',
        function () {
          expect(path).toHaveAttr(
            'stroke-width', testLine.config('strokeWidth')
          );
        }
      );

    });

    describe('render()', function () {

      var selection;

      beforeEach(function () {
        selection = jasmine.svgFixture();
        setData();
        spyOn(testLine, 'update');
        testLine.render(selection);
      });

      it('appends svg:group element to the selection', function () {
        var group = selection.select('g').node();
        expect(group.nodeName.toLowerCase()).toBe('g');
      });

      it('appends svg:path to the root element', function () {
          var path = selection.select('path').node();
          expect(path).not.toBeNull();
        }
      );

      it('sets a class on svg:path to the root element', function () {
          var path = selection.select('path').node();
          expect(path).toHaveClasses('gl-line');
        }
      );

      it('calls the update function', function () {
        expect(testLine.update).toHaveBeenCalled();
      });

    });

  });

});
