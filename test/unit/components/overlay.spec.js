define([
  'components/overlay',
  'test-util/component'
],
function(overlay, componentUtil) {
  'use strict';

  describe('components.overlay', function() {
    var testOverlay, selection, rect, root, mockComponent;

    beforeEach(function() {
      selection = jasmine.svgFixture();
      testOverlay = overlay();
      spyOn(testOverlay, 'update').andCallThrough();
      testOverlay.render(selection);
      root = testOverlay.root();
      rect = root.select('rect');
      mockComponent = componentUtil.getMockComponent();
      mockComponent.target = root;
    });

    it('adds all convenience functions', function() {
      expect(testOverlay).toHaveProperties('cid', 'target', 'cssClass',
          'opacity', 'backgroundColor', 'layoutConfig');
    });

    describe('root()', function() {

      it('gets the root element', function() {
        var firstChild = selection.node().firstChild;
        expect(root.node()).toBe(firstChild);
      });

    });

    describe('render()', function() {

      it('renders to the provided selection', function() {
        expect(root.node().parentNode).toBe(selection.node());
      });

      it('creates a root <g> element', function() {
        expect(root.node().nodeName).toBe('g');
      });

      it('adds the correct css classes', function() {
        expect(root.node()).toHaveClasses('gl-overlay');
      });

      it('calls update', function() {
        expect(testOverlay.update).toHaveBeenCalledOnce();
      });

      it('appends a rect', function() {
        expect(rect).not.toBeNull();
      });

      it('sets the rect width to match the container', function() {
        expect(rect.width()).toBe(selection.width());
      });

      it('sets the rect height to match the container', function() {
        expect(rect.height()).toBe(selection.height());
      });

    });

    describe('update()', function() {

      it('updates the css class', function() {
        testOverlay.cssClass('my-class').update();
        expect(testOverlay.cssClass()).toBe('my-class');
        expect(root.node()).toHaveClasses('my-class');
      });

      it('updates the cid', function() {
        testOverlay.cid('my-cid').update();
        expect(testOverlay.cid()).toBe('my-cid');
        expect(root.node()).toHaveAttr('gl-cid', 'my-cid');
      });

      it('updates the opacity', function() {
        testOverlay.opacity(0.8).update();
        rect = root.select('rect');
        expect(testOverlay.opacity()).toBe(0.8);
        expect(rect.node()).toHaveAttr('opacity', '0.8');
      });

      it('updates the background color', function() {
        testOverlay.backgroundColor('#f00').update();
        rect = root.select('rect');
        expect(testOverlay.backgroundColor()).toBe('#f00');
        expect(rect.node()).toHaveAttr('fill', '#f00');
      });

      it('renders sub components', function() {
        spyOn(mockComponent, 'render');
        testOverlay.config('components', [mockComponent]);
        testOverlay.update();
        expect(mockComponent.render).toHaveBeenCalledOnce();
      });

      it('removes previous components', function() {
        testOverlay.config('components', [mockComponent]);
        testOverlay.update();
        // rect + componnets container + component
        expect(root.selectAll('*')).toBeSelectionLength(3);
        testOverlay.config('components', []);
        testOverlay.update();
        // rect + componnets container
        expect(root.selectAll('*')).toBeSelectionLength(2);
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        spyOn(mockComponent, 'destroy');
        testOverlay.config('components', [mockComponent]);
        testOverlay.destroy();
      });

      it('calls destroy() on subcomponents', function() {
        expect(mockComponent.destroy).toHaveBeenCalled();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
