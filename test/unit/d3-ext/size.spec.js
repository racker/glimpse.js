define([
  'd3-ext/d3-ext'
],
function() {
  'use strict';

  var g, rect, layoutRect;

  describe('selection.size', function() {

    beforeEach(function() {
      g = jasmine.svgFixture().append('g');
      rect = jasmine.svgFixture().append('rect');
    });

    describe('selection.size', function() {

      beforeEach(function() {
        g.size(400, 200);
        layoutRect = g.select('rect');
      });

      it('sets the g.gl-height', function() {
        expect(g.node()).toHaveAttr('gl-height', 200);
      });

      it('sets the g.gl-width', function() {
        expect(g.node()).toHaveAttr('gl-width', 400);
      });

      it('appends the rect', function() {
        expect(layoutRect).toBeSelectionLength(1);
      });

      it('sets the gl-layout class on the rect', function() {
        expect(layoutRect.node()).toHaveClasses('gl-layout');
      });

      it('sets the width on the rect', function() {
        expect(layoutRect.node()).toHaveAttr('width', 400);
      });

      it('sets the height on the rect', function() {
        expect(layoutRect.node()).toHaveAttr('height', 200);
      });

      it('sets the rect fill to none', function() {
        expect(layoutRect.node()).toHaveAttr('fill', 'none');
      });

      it('does not append a second rectangle', function() {
        g.size(400, 200);
        expect(g.selectAll('rect')).toBeSelectionLength(1);
      });

      it('only appends rect only once and updates attrs on subsequent calls',
      function() {
        var testRect;

        g.size(300, 200);
        testRect = g.selectAll('rect');
        expect(testRect[0].length).toBe(1);
        expect(testRect.node()).toHaveAttr({
          width: 300,
          height: 200
        });
      });

    });

    describe('seleciton.width() / selection.height()', function() {

      beforeEach(function() {
        g.height(15);
        g.width(12);
        rect.height(40);
        rect.width(20);
        layoutRect = g.select('rect.gl-layout');
      });

      describe('selection.width', function() {

        it('returns correct width of group', function() {
          expect(g.width()).toBe(12);
        });

        it('returns correct width of rect', function() {
          expect(rect.width()).toBe(20);
        });

        it('returns width attribute of group', function() {
          g.append('rect').width(1000).height(1);
          expect(g.width()).toBe(12);
        });

        it('returns BBox width if width attr of group is not set', function() {
          g.append('rect').width(1000).height(1);
          g.attr('gl-width', null);
          expect(g.width()).toBe(1000);
        });

        it('sets the gl-width of a <g>', function() {
          expect(g.node()).toHaveAttr('gl-width', '12');
        });

        it('adds a layout rect for <g> elements', function() {
          expect(layoutRect.empty()).toBe(false);
        });

        it('sets the width of the layout rect', function() {
          expect(layoutRect.node()).toHaveAttr('width', '12');
          expect(layoutRect.width()).toBe(12);
        });

      });

      describe('selection.height', function() {

        it('returns correct hieght of group', function() {
          expect(g.height()).toBe(15);
        });

        it('returns correct height of rect', function() {
          expect(rect.height()).toBe(40);
        });

        it('returns height attribute of group', function() {
          g.append('rect').height(1000).width(1);
          expect(g.height()).toBe(15);
        });

        it('returns BBox height if width attr of group is not set', function() {
          g.append('rect').height(1000).width(1);
          g.attr('gl-height', null);
          expect(g.height()).toBe(1000);
        });

        it('sets the gl-height of a <g>', function() {
          expect(g.node()).toHaveAttr('gl-height', '15');
        });

        it('adds a layout rect for <g> elements', function() {
          expect(layoutRect.empty()).toBe(false);
        });

        it('sets the height of the layout rect', function() {
          expect(layoutRect.node()).toHaveAttr('height', '15');
          expect(layoutRect.height()).toBe(15);
        });

      });

    });

  });

});
