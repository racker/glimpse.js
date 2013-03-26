define([
  'd3-ext/d3-ext'
],
function () {
  'use strict';

  describe('d3.selection.prototype.border()', function() {

    var node, borderInfo, w, h, lines, line;

    beforeEach(function() {
      w = 400;
      h = 300;
      node = jasmine.svgFixture().append('g').size(w, h);
    });

    describe('border-solid', function() {
      var strokeWidth = 10;

      describe('border', function() {
        beforeEach(function() {
          borderInfo = {
            style: 'solid',
            color: 'red',
            width: [strokeWidth, strokeWidth, strokeWidth, strokeWidth]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
        });

        it('adds four dotted lines', function() {
          expect(lines[0].length).toBe(4);
        });

        it('adds a dotted line for top border', function() {
          line = node.select('.gl-solid-border-top').node();
          expect(line).toHaveAttr({
            'x1': 0,
            'y1': strokeWidth/2,
            'x2': w,
            'y2': strokeWidth/2,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color
          });
        });

        it('adds a dotted line for right border', function() {
          line = node.select('.gl-solid-border-right').node();
          expect(line).toHaveAttr({
            'x1': w - strokeWidth/2,
            'y1': 0,
            'x2': w - strokeWidth/2,
            'y2': h,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color
          });
        });

        it('adds a dotted line for bottom border', function() {
          line = node.select('.gl-solid-border-bottom').node();
          expect(line).toHaveAttr({
            'x1': 0,
            'y1': h - strokeWidth/2,
            'x2': w,
            'y2': h - strokeWidth/2,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color
          });
        });

        it('adds a dotted line for left border', function() {
          line = node.select('.gl-solid-border-left').node();
          expect(line).toHaveAttr({
            'x1': strokeWidth/2,
            'y1': 0,
            'x2': strokeWidth/2,
            'y2': h,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color
          });

        });

      });

      describe('individual borders', function() {
        it('adds a solid line for borderTop', function() {
          borderInfo = {
            style: 'solid',
            width: [1, 0, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-solid-border-top').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a solid line for borderRight', function() {
          borderInfo = {
            style: 'solid',
            width: [0, 1, 0, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-solid-border-right').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a solid line for borderBottom', function() {
          borderInfo = {
            style: 'solid',
            width: [0, 0, 1, 0]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-solid-border-bottom').node();
          expect(line).toBeDefinedAndNotNull();
        });

        it('adds a solid line for borderLeft', function() {
          borderInfo = {
            style: 'solid',
            width: [0, 0, 0, 1]
          };
          node.size(w, h);
          node.border(borderInfo.style, borderInfo.color, borderInfo.width);
          lines = node.selectAll('line');
          expect(lines[0].length).toBe(1);
          line = node.select('.gl-solid-border-left').node();
          expect(line).toBeDefinedAndNotNull();
        });

      });

    });

    describe('border-dotted', function() {
      var strokeWidth;
      strokeWidth = 2;

      describe('border', function() {
        beforeEach(function() {
          borderInfo = {
            style: 'dotted',
            color: 'red',
            width: [strokeWidth, strokeWidth, strokeWidth, strokeWidth]
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
            'y1': strokeWidth/2,
            'x2': w,
            'y2': strokeWidth/2,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });
        });

        it('adds a dotted line for right border', function() {
          line = node.select('.gl-dotted-border-right').node();
          expect(line).toHaveAttr({
            'x1': w - strokeWidth/2,
            'y1': 0,
            'x2': w - strokeWidth/2,
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
            'y1': h - strokeWidth/2,
            'x2': w,
            'y2': h - strokeWidth/2,
            'stroke-width': borderInfo.width[0],
            'stroke': borderInfo.color,
            'stroke-dasharray':'1,1'
          });
        });

        it('adds a dotted line for left border', function() {
          line = node.select('.gl-dotted-border-left').node();
          expect(line).toHaveAttr({
            'x1': strokeWidth/2,
            'y1': 0,
            'x2': strokeWidth/2,
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
      var strokeWidth;
      strokeWidth = 15;
      beforeEach(function() {
        borderInfo = {
          style: 'dashed',
          color: 'red',
          width: [strokeWidth, strokeWidth, strokeWidth, strokeWidth]
        };
        node.border(borderInfo.style, borderInfo.color, borderInfo.width);
      });

      it('adds a dashed line for top border', function() {
        line = node.select('.gl-dashed-border-top').node();
        expect(line).toHaveAttr({
          'x1': 0,
          'y1': strokeWidth/2,
          'x2': w,
          'y2': strokeWidth/2,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });
      });

      it('adds a dashed line for right border', function() {
        line = node.select('.gl-dashed-border-right').node();
        expect(line).toHaveAttr({
          'x1': w - strokeWidth/2,
          'y1': 0,
          'x2': w - strokeWidth/2,
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
          'y1': h - strokeWidth/2,
          'x2': w,
          'y2': h - strokeWidth/2,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });
      });

      it('adds a dashed line for left border', function() {
        line = node.select('.gl-dashed-border-left').node();
        expect(line).toHaveAttr({
          'x1': strokeWidth/2,
          'y1': 0,
          'x2': strokeWidth/2,
          'y2': h,
          'stroke-width': borderInfo.width[0],
          'stroke': borderInfo.color,
          'stroke-dasharray':'5,5'
        });

      });

    });

  });

});
