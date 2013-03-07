define([
  'd3-ext/d3-ext'
],
function () {
  'use strict';

  describe('selection.backgroundColor', function() {

    var g;

    beforeEach(function() {
      g = jasmine.svgFixture().append('g');
      g.attr({
        height: 500,
        width: 300
      });
    });

    describe('backgroundColor', function() {
      it('sets background color on the rectangle in node', function() {
        g.backgroundColor('red');
        expect(g.select('.gl-layout-size').node()).toHaveAttr('fill', 'red');
      });

      it('does not set the color if node is not g', function() {
        var rect;
        rect = g.append('rect');
        rect.backgroundColor('red');
        expect(rect.node()).not.toHaveAttr('fill', 'red');
      });

      it('does not set the color if node is not g', function() {
        var rect;
        rect = g.append('rect');
        rect.backgroundColor('red');
        expect(rect.node()).not.toHaveAttr('fill', 'red');
      });

      it('appends rect only once and updates color on subsequent calls',
      function() {
        var testRect;
        g.backgroundColor('red');
        g.backgroundColor('green');
        testRect = g.selectAll('rect');
        expect(testRect[0].length).toBe(1);
        expect(testRect.node()).toHaveAttr({
          fill: 'green'
        });
      });

    });

  });

});
