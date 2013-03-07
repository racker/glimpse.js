define([
  'd3-ext/d3-ext'
],
function() {
  'use strict';

  var g, rect;

  describe('selection.size', function() {

    beforeEach(function() {
      g = jasmine.svgFixture().append('g');
      rect = jasmine.svgFixture().append('rect');
    });

    describe('selection.size', function() {

      it('appends the rectange and set width, height attributes', function() {
        g.size(400, 200);
        expect(g.node()).toHaveXML([
          '<g gl-width="400" gl-height="200">',
            '<rect class="gl-layout-size" ',
                    'width="400" height="200" fill="none"/>',
          '</g>'].join(''));
      });

      it('does not append a second rectangle', function() {
        rect.size(400, 200);
        expect(rect.node()).toHaveAttr({
          width: 400,
          height: 200
        });
      });

      it('only appends rect only once and updates attrs on subsequent calls',
      function() {
        var testRect;

        g.size(400, 200);
        g.size(300, 200);
        testRect = g.selectAll('rect');
        expect(testRect[0].length).toBe(1);
        expect(testRect.node()).toHaveAttr({
          width: 300,
          height: 200
        });
      });

    });

    describe('selection.width', function() {

      beforeEach(function() {
        g.size(12, 15);
        rect.size(20,40);
      });

      it('returns correct width of group', function() {
        expect(g.width()).toBe(12);
      });

      it('returns correct width of rect', function() {
        expect(rect.width()).toBe(20);
      });

      it('returns width attribute of group', function() {
        g.append('rect').size(1000, 1000);
        expect(g.width()).toBe(12);
      });

      it('returns BBox width if width attr of group is not set', function() {
        g.append('rect').size(1000, 1000);
        g.attr('gl-width', null);
        expect(g.width()).toBe(1000);
      });

    });

    describe('selection.height', function() {

      beforeEach(function() {
        g.size(12, 15);
        rect.size(20,40);
      });

      it('returns correct hieght of group', function() {
        expect(g.height()).toBe(15);
      });

      it('returns correct height of rect', function() {
        expect(rect.height()).toBe(40);
      });

      it('returns height attribute of group', function() {
        g.append('rect').size(1000, 1000);
        expect(g.height()).toBe(15);
      });

      it('returns BBox height if width attr of group is not set', function() {
        g.append('rect').size(1000, 1000);
        g.attr('gl-height', null);
        expect(g.height()).toBe(1000);
      });

    });

  });

});
