define([
  'd3-ext/d3-ext'
],
function () {
  'use strict';

  describe('d3.selection.prototype.clip()', function() {

    var gSelection, gNode, defs, clipPath, clipRect, layoutRect;

    beforeEach(function() {
      gSelection = jasmine.svgFixture().append('g').attr('id', 'testNode');
      gNode = gSelection.node();
      gSelection.size(200, 100);
      gSelection.clip();
      layoutRect = gSelection.select('rect.gl-layout');
      defs = gSelection.selectAll('defs');
      clipPath = defs.node().childNodes[0];
      clipRect = clipPath.childNodes[0];
    });

    describe('<g> node', function() {

      it('sets the gl-clip attr', function() {
        expect(gNode).toHaveAttr('gl-clip', 'true');
      });

      it('sets the <g> clip-path attr to the <clippath> id', function() {
        var value = gSelection.attr('clip-path');
        //Fix to make it match in IE
        expect(value).toContain(clipPath.getAttribute('id'));
      });

      it('adds a layout <rect> node if it doesnt exist', function() {
        expect(gSelection.selectAll('rect.gl-layout')).toBeSelectionLength(1);
      });

      it('doesnt re-add a layout <rect> node if already exist', function() {
        gSelection.clip();
        gSelection.clip();
        expect(gSelection.selectAll('rect.gl-layout')).toBeSelectionLength(1);
      });

      it('adds a <defs> node to the <g> node', function() {
        expect(defs).toBeSelectionLength(1);
      });

      it('only adds 1 <defs> node to the <g> node', function() {
        gSelection.clip();
        gSelection.clip();
        expect(gSelection.selectAll('defs')).toBeSelectionLength(1);
      });

      it('adds a <clippath> node to the <defs> node', function() {
        expect(clipPath.tagName).toBe('clipPath');
      });

      it('adds the gl-clip-path class to the <clippath> node', function() {
        expect(clipPath).toHaveClasses('gl-clip-path');
      });

      it('adds an id to the <clippath> node', function() {
        expect(clipPath.hasAttribute('id')).toBe(true);
      });

      it('adds a <rect> node to the <clipPath> node', function() {
        expect(clipRect.tagName).toBe('rect');
      });

      it('sets the clip rect to the correct width/height', function() {
        expect(clipRect).toHaveAttr({
          width: 200, height: 100
        });
      });

    });

    describe('non <g> node', function() {
      var rect, rectNode;

      beforeEach(function() {
        rect = gSelection.append('rect');
        rectNode = rect.node();
        rect.clip();
      });

      it('does not set the gl-clip attr if not a <g> node', function() {
        expect(rectNode).not.toHaveAttr('gl-clip', 'true');
      });

      it('does not add a <defs> node if not a <g> node', function() {
        expect(rectNode).not.toHaveAttr('gl-clip', 'true');
      });

    });

  });

});
