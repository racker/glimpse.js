define([
  'd3-ext/d3-ext'
],
function(d3) {
  'use strict';

  describe('selection.position', function() {

    var g, rect;

    beforeEach(function() {
      var container1, container2;
      container1 = jasmine.svgFixture().append('g').size(200, 200);
      container2 = jasmine.svgFixture().append('g').size(300, 150);
      g = container1.append('g').size(10, 10).node();
      rect = container2.append('rect').size(10, 10).node();
    });

    it('centers a group element', function() {
      expect(g).not.toHaveAttr('transform');
      d3.select(g).center();
      expect(g).toHaveTranslate(95, 95);
    });

   it('centers a group element and applies offset', function() {
      expect(g).not.toHaveAttr('transform');
      d3.select(g).center(10, 10);
      expect(g).toHaveTranslate(105, 105);
    });

    it('centers the group element and applies negative offset', function() {
      expect(g).not.toHaveAttr('transform');
      d3.select(g).center(-5, -5);
      expect(g).toHaveTranslate(90, 90);
    });

    it('centers a rect element', function() {
      expect(rect).not.toHaveAttr('x');
      d3.select(rect).center();
      expect(rect).toHaveXY(145, 70);
    });

   it('centers a rect element and applies offset', function() {
      expect(rect).not.toHaveAttr('transform');
      d3.select(rect).center(10, 10);
      expect(rect).toHaveXY(155, 80);
    });

    it('centers the rect element and applies negative offset', function() {
      expect(rect).not.toHaveAttr('transform');
      d3.select(rect).center(-5, -5);
      expect(rect).toHaveXY(140, 65);
    });


    describe('top-left', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-left');
        expect(g).toHaveTranslate(0, 0);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('top-left');
        expect(rect).toHaveXY(0, 0);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-left', 10, 10);
        expect(g).toHaveTranslate(10, 10);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('top-left', 10, 10);
        expect(rect).toHaveXY(10, 10);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-left', -5, -5);
        expect(g).toHaveTranslate(-5, -5);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('top-left', -5, -5);
        expect(rect).toHaveXY(-5, -5);
      });

    });

    describe('top-right', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-right');
        expect(g).toHaveTranslate(190, 0);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('top-right');
        expect(rect).toHaveXY(290, 0);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-right', 10, 10);
        expect(g).toHaveTranslate(200, 10);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('top-right', 10, 10);
        expect(rect).toHaveXY(300, 10);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('top-right', -5, -5);
        expect(g).toHaveTranslate(185, -5);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('top-right', -5, -5);
        expect(rect).toHaveXY(285, -5);
      });

    });

    describe('center-top', function() {
      it('centers the group element', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-top');
        expect(g).toHaveTranslate(95, 0);
      });

     it('centers a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('center-top');
        expect(rect).toHaveXY(145, 0);
      });

     it('centers the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-top', 10, 10);
        expect(g).toHaveTranslate(105, 10);
      });

      it('centers a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-top', 10, 10);
        expect(rect).toHaveXY(155, 10);
      });

      it('centers the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-top', -5, -5);
        expect(g).toHaveTranslate(90, -5);
      });

      it('centers the rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-top', -5, -5);
        expect(rect).toHaveXY(140, -5);
      });

    });

    describe('center-bottom', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-bottom');
        expect(g).toHaveTranslate(95, 190);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('center-bottom');
        expect(rect).toHaveXY(145, 140);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-bottom', 10, 10);
        expect(g).toHaveTranslate(105, 200);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-bottom', 10, 10);
        expect(rect).toHaveXY(155, 150);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-bottom', -5, -5);
        expect(g).toHaveTranslate(90, 185);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-bottom', -5, -5);
        expect(rect).toHaveXY(140, 135);
      });

    });


    describe('center-left', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-left');
        expect(g).toHaveTranslate(0, 95);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('center-left');
        expect(rect).toHaveXY(0, 70);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-left', 10, 10);
        expect(g).toHaveTranslate(10, 105);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-left', 10, 10);
        expect(rect).toHaveXY(10, 80);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-left', -5, -5);
        expect(g).toHaveTranslate(-5, 90);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-left', -5, -5);
        expect(rect).toHaveXY(-5, 65);
      });

    });

    describe('center', function() {
      it('centers the group element', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center');
        expect(g).toHaveTranslate(95, 95);
      });

     it('centers a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('center');
        expect(rect).toHaveXY(145, 70);
      });

     it('centers the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center', 10, 10);
        expect(g).toHaveTranslate(105, 105);
      });

      it('centers a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center', 10, 10);
        expect(rect).toHaveXY(155, 80);
      });

      it('centers the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center', -5, -5);
        expect(g).toHaveTranslate(90, 90);
      });

      it('centers the rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center', -5, -5);
        expect(rect).toHaveXY(140, 65);
      });

    });

    describe('center-right', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-right');
        expect(g).toHaveTranslate(190, 95);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('center-right');
        expect(rect).toHaveXY(290, 70);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-right', 10, 10);
        expect(g).toHaveTranslate(200, 105);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-right', 10, 10);
        expect(rect).toHaveXY(300, 80);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('center-right', -5, -5);
        expect(g).toHaveTranslate(185, 90);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('center-right', -5, -5);
        expect(rect).toHaveXY(285, 65);
      });

    });

    describe('bottom-left', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-left');
        expect(g).toHaveTranslate(0, 190);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('bottom-left');
        expect(rect).toHaveXY(0, 140);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-left', 10, 10);
        expect(g).toHaveTranslate(10, 200);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('bottom-left', 10, 10);
        expect(rect).toHaveXY(10, 150);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-left', -5, -5);
        expect(g).toHaveTranslate(-5, 185);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('bottom-left', -5, -5);
        expect(rect).toHaveXY(-5, 135);
      });

    });

    describe('bottom-right', function() {
      it('positions the group', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-right');
        expect(g).toHaveTranslate(190, 190);
      });

     it('positions a rect element', function() {
        expect(rect).not.toHaveAttr('x');
        d3.select(rect).position('bottom-right');
        expect(rect).toHaveXY(290, 140);
      });

     it('positions the group element and applies offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-right', 10, 10);
        expect(g).toHaveTranslate(200, 200);
      });

      it('positions a rect element and applies offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('bottom-right', 10, 10);
        expect(rect).toHaveXY(300, 150);
      });

      it('positions the group element and applies negative offset', function() {
        expect(g).not.toHaveAttr('transform');
        d3.select(g).position('bottom-right', -5, -5);
        expect(g).toHaveTranslate(185, 185);
      });

      it('positions a rect element and applies negative offset', function() {
        expect(rect).not.toHaveAttr('transform');
        d3.select(rect).position('bottom-right', -5, -5);
        expect(rect).toHaveXY(285, 135);
      });

    });

  });

});
