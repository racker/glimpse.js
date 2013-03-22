define([
  'd3-ext/d3-ext'
],
function () {
  'use strict';

  describe('layout.util', function() {

    var node, borderInfo, w, h, rect;

    beforeEach(function() {
      w = 400;
      h = 300;
      node = jasmine.svgFixture().append('g').size(w, h);
    });

    describe('border-solid', function() {
      var expectedValue;

      describe('border', function() {
        beforeEach(function() {
          borderInfo = {
            style: 'solid',
            color: 'red',
            width: [1, 1, 1, 1]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          rect = node.select('.gl-layout').node();
        });

        it('sets stroke-dasharray', function() {
          expectedValue = [w,0,h,0,w,0,h];
          expect(rect).toHaveAttr(
            'stroke-dasharray', expectedValue.toString()
          );
        });

        it('sets stroke-width', function() {
          expect(rect).toHaveAttr(
            'stroke-width', borderInfo.width[0]
          );
        });

        it('sets stroke', function() {
          expect(rect).toHaveAttr(
            'stroke', borderInfo.color
          );
        });

      });

      describe('individual borders', function() {
        it('stroke-dasharray for top border', function() {
         borderInfo = {
            style: 'solid',
            color: 'red',
            width: [1, 0, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          rect = node.select('.gl-layout').node();
          expectedValue = [w,h,0,w,0,h];
          expect(rect).toHaveAttr(
            'stroke-dasharray', expectedValue.toString()
          );
        });

        it('stroke-dasharray for right border', function() {
          borderInfo = {
            style: 'solid',
            color: 'red',
            width: [0, 1, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          rect = node.select('.gl-layout').node();
          expectedValue = [0,w,h,w,0,h];
          expect(rect).toHaveAttr(
            'stroke-dasharray', expectedValue.toString()
          );
        });

        it('stroke-dasharray for bottom border', function() {
          borderInfo = {
            style: 'solid',
            color: 'red',
            width: [0, 0, 1, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          rect = node.select('.gl-layout').node();
          expectedValue = [0,w,0,h,w,h];
          expect(rect).toHaveAttr(
            'stroke-dasharray', expectedValue.toString()
          );
        });

        it('stroke-dasharray for left border', function() {
          borderInfo = {
            style: 'solid',
            color: 'red',
            width: [0, 0, 0, 1]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          rect = node.select('.gl-layout').node();
          expectedValue = [0,w,0,h,0,w,h];
          expect(rect).toHaveAttr(
            'stroke-dasharray', expectedValue.toString()
          );
        });

      });

    });

    describe('border-dotted', function() {
      var lines, line;

      describe('border', function() {
        beforeEach(function() {
          borderInfo = {
            style: 'dotted',
            color: 'red',
            width: [1, 1, 1, 1]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
        });

        it('adds four dotted lines', function() {
          expect(lines[0].length).toBe(4);
        });

        it('adds a dotted line for top border', function() {
          line = node.select('.gl-dotted-border-top').node();
          expect(line).toHaveAttr({
            'x1': 0,
            'y1': 0,
            'x2': w,
            'y2': 0,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });
        });

        it('adds a dotted line for right border', function() {
          line = node.select('.gl-dotted-border-right').node();
          expect(line).toHaveAttr({
            'x1': w,
            'y1': 0,
            'x2': w,
            'y2': h,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });
        });

        it('adds a dotted line for bottom border', function() {
          line = node.select('.gl-dotted-border-bottom').node();
          expect(line).toHaveAttr({
            'x1': 0,
            'y1': h,
            'x2': w,
            'y2': h,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });
        });

        it('adds a dotted line for left border', function() {
          line = node.select('.gl-dotted-border-left').node();
          expect(line).toHaveAttr({
            'x1': 0,
            'y1': 0,
            'x2': 0,
            'y2': h,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });

        });

      });

      describe('individual borders', function() {

        it('adds a dotted line for borderTop', function() {
          borderInfo = {
            style: 'dotted',
            width: [1, 0, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-dotted-border-top').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a dotted line for borderRight', function() {
          borderInfo = {
            style: 'dotted',
            width: [0, 1, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-dotted-border-right').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a dotted line for borderBottom', function() {
          borderInfo = {
            style: 'dotted',
            width: [0, 0, 1, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-dotted-border-bottom').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a dotted line for borderLeft', function() {
          borderInfo = {
            style: 'dotted',
            width: [0, 0, 0, 1]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-dotted-border-left').node();
          expect(line).toBeDefinedAndNotNull();
        });

      });
    });

    describe('border-dashed', function() {
      var line;
      beforeEach(function() {
        borderInfo = {
          style: 'dashed',
          color: 'red',
          width: [1, 1, 1, 1]
        };
        node.border(borderInfo.style, borderInfo.color, borderInfo.width);
      });

      it('adds a dashed line for top border', function() {
        line = node.select('.gl-dashed-border-top').node();
        expect(line).toHaveAttr({
          'x1': 0,
          'y1': 0,
          'x2': w,
          'y2': 0,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });
      });

      it('adds a dashed line for right border', function() {
        line = node.select('.gl-dashed-border-right').node();
        expect(line).toHaveAttr({
          'x1': w,
          'y1': 0,
          'x2': w,
          'y2': h,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });
      });

      it('adds a dashed line for bottom border', function() {
        line = node.select('.gl-dashed-border-bottom').node();
        expect(line).toHaveAttr({
          'x1': 0,
          'y1': h,
          'x2': w,
          'y2': h,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });
      });

      it('adds a dashed line for left border', function() {
        line = node.select('.gl-dashed-border-left').node();
        expect(line).toHaveAttr({
          'x1': 0,
          'y1': 0,
          'x2': 0,
          'y2': h,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });

      });

    });

  });

});
