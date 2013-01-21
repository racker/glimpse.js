define([
  'd3',
  'core/object',
  'components/component'
],
function (d3, object, components) {
  'use strict';

  describe('components.line', function () {

    var lineComponent, data, defaults, x, y;

    data = [{
      id:'fakeData',
      data: [
        {"x":13,"y":106},
        {"x":15,"y":56},
        {"x":17,"y":100}
      ]
    }];

    function setData() {
      lineComponent.config({'dataId': 'fakeData'});
      lineComponent.data(data);
    }

    function setScales() {
      lineComponent.xScale(d3.time.scale());
      lineComponent.yScale(d3.scale.linear());
    }

    beforeEach(function (){
      spyOn(object, 'extend').andCallThrough();
      lineComponent = components.line();
    });

    afterEach(function (){
      lineComponent = null;
    });

    it('line component has required set of properties', function () {
      expect(lineComponent).toHaveProperties(
        'xScale',
        'yScale',
        'data',
        'lineGenerator',
        'x',
        'y'
      );
    });

    describe('checks all defaults are being set', function () {
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
        config = lineComponent.config();
      });

      it('config has default isFramed', function () {
        expect(config.isFramed).toBe(defaults.isFramed);
      });

      it('config has default strokeWidth', function () {
        expect(config.strokeWidth).toBe(defaults.strokeWidth);
      });

      it('config has default showInLegend', function () {
        expect(config.showInLegend).toBe(defaults.showInLegend);
      });

      it('config has default lineGenerator', function () {
        expect(config.lineGenerator.toString())
        .toBe(defaults.lineGenerator.toString());
      });

      it('config has default interpolate', function () {
        expect(config.interpolate).toBe(defaults.interpolate);
      });

    });

    describe('data()', function () {

      it('sets/gets the data on the line', function () {
        setData();
        expect(lineComponent.data()).toBe(data[0]);
      });

    });

    describe('xScale()', function () {

      it('sets/gets the xScale', function () {
        var xScale = d3.time.scale();
        lineComponent.xScale(xScale);
        expect(lineComponent.xScale()).toBe(xScale);
      });

    });

    describe('yScale()', function () {

      it('sets/gets the yScale', function () {
        var yScale = d3.scale.linear();
        lineComponent.yScale(yScale);
        expect(lineComponent.yScale()).toBe(yScale);
      });

    });

    describe('update()', function () {
      var selection, path, lineGenerator;

      beforeEach(function (){
        selection = jasmine.svgFixture();
        setData();
        setScales();
        lineComponent.render(selection);
        lineComponent.update();
        path = selection.select('path').node();
      });

      it('configures the lineGenerator', function () {
        expect(lineComponent.lineGenerator()).toBeDefinedAndNotNull();
      });

      it('configures x on lineGenerator', function () {
        expect(lineComponent.lineGenerator().x).toBeDefinedAndNotNull();
      });

      it('configures y on lineGenerator', function () {
        expect(lineComponent.lineGenerator().y).toBeDefinedAndNotNull();
      });

      it('line has attribute fill', function () {
        expect(path).toHaveAttr('fill', 'none');
      });

      it('line has attribute stroke with configured color value',
        function () {
          expect(path).toHaveAttr('stroke', lineComponent.config('color'));
        }
      );

      it('line attribute stroke-width with configured stroke-width value',
        function () {
          expect(path).toHaveAttr(
            'stroke-width', lineComponent.config('strokeWidth')
          );
        }
      );

    });

    describe('render()', function () {

      var selection;

      beforeEach(function () {
        selection = jasmine.svgFixture();
        setData();
        spyOn(lineComponent, 'update');
        lineComponent.render(selection);
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
          expect(path).toHaveClasses('line');
        }
      );

      it('calls the update function', function () {
        expect(lineComponent.update).toHaveBeenCalled();
      });

    });

  });

});