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
      testLine.config({'dataId': id || 'fakeData', color: '#000'});
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
        'destroy',
        'rootId'
      );
    });

    describe('config()', function() {
      var config, defaults;

      defaults = {
        strokeWidth: 1.5,
        color: 'steelBlue',
        inLegend: true,
        lineGenerator: d3.svg.line(),
        interpolate: 'linear',
        showHighlightTransition: false,
        highlightRadius: 4,
        highlightFill: '#fff',
        highlightStrokeWidth: 2,
        showTooltip: false,
        showHighlight: true
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

      it('has default showHighlightTransition', function() {
        expect(config.showHighlightTransition)
          .toBe(defaults.showHighlightTransition);
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

    describe('handles null values', function() {

      // Currently null values are interpreted as zero.
      // This will be changed in the future.

      var selection;

      function getData(val) {
        return [{
          id:'fakeData',
          data: [
            { x: 13, y: 106},
            { x: val, y: 56},
            { x: 17, y: 100}
          ]
        }];
      }

      function getDataAttribute(comp) {
        return d3.select(comp.root().node().childNodes[0]).attr('d');
      }

      function renderLine(data) {
        var l = line(),
            d = dc.create();
        d.add(data);
        l.data(d);
        l.xScale(d3.time.scale());
        l.yScale(d3.scale.linear());
        l.config({'dataId': 'fakeData', color: '#000'});
        l.render('#svg-fixture');
        return l;
      }

      it('renders null as zeros', function() {
        var l1, l2;
        selection = jasmine.svgFixture();
        l1 = renderLine(getData(null));
        l2 = renderLine(getData(0));
        expect(getDataAttribute(l1)).toBe('M13,106L0,56L17,100');
        expect(getDataAttribute(l1)).toBe(getDataAttribute(l2));
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

    describe('handle dashed config option', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        setScales();
        testLine.render('#svg-fixture');
      });

      it('doesnt add dash-array attr if dashed config is false', function() {
        var lineSel = testLine.root().select('path');
        expect(lineSel.attr('stroke-dasharray')).toBe(null);
      });

      it('adds default dash-array attribute', function() {
        var lineSel;
        testLine.config('dashed', true);
        testLine.update();
        lineSel = testLine.root().select('path');
        expect(lineSel.attr('stroke-dasharray')).toBe('5, 5');
      });

      it('adds explicitly specified dash-array attribute', function() {
        var lineSel;
        testLine.config({ 'dashed': true, 'strokeDashArray': '6, 6' });
        testLine.update();
        lineSel = testLine.root().select('path');
        expect(lineSel.attr('stroke-dasharray')).toBe('6, 6');
      });

    });


    describe('handleDataToggle()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        setScales();
        testLine.render('#svg-fixture');
      });

      it('toggles the line to hide in data tag is inactive', function() {
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testLine.root().node()).toHaveAttr('display', 'none');
      });

      it('toggles the line to show after checking data tag', function() {
        dataCollection.addTags('fakeData', 'inactive');
        dataCollection.toggleTags('fakeData', 'inactive');
        expect(testLine.root().node()).not.toHaveAttr('display', 'none');
      });

    });

    describe('update()', function() {
      var selection, path;

      beforeEach(function(){
        selection = jasmine.svgFixture();
        setData();
        setScales();
        testLine.config('showHighlight', false);
        testLine.render('#svg-fixture');
        testLine.on('update', handlerSpy);
        spyOn(testLine, 'highlight');
        spyOn(testLine, 'pubsubHighlightEvents');
        testLine.config('showHighlight', true);
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

      it('calls the highlight method when showHighlight is true', function() {
        expect(testLine.highlight).toHaveBeenCalled();
      });

      it('calls the pubsubHightlightEvents method when showHighlight is true',
        function() {
          expect(testLine.pubsubHighlightEvents).toHaveBeenCalled();
      });

    });

    describe('render()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        testLine.config('showHighlight', false);
        spyOn(testLine, 'update');
        spyOn(testLine, 'highlight');
        testLine.on('render', handlerSpy);
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

      it('does not call highlight if showHighlight is set to false',
        function() {
          expect(testLine.highlight).not.toHaveBeenCalled();
      });

    });

    describe('destroy()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        setData();
        spyOn(testLine, 'update');
        testLine.render(selection);
        testLine.on('destroy', handlerSpy);
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

      it('returns gracefully with no data', function() {
        expect(exceptionCaught).toBe(false);
      });

    });

  });

});
