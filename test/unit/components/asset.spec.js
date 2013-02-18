define([
  'components/asset'
],
function(asset) {
  'use strict';

  describe('components.overlay', function() {
    var testAsset, selection, root, useEl;

    beforeEach(function() {
      selection = jasmine.svgFixture();
      testAsset = asset();
      spyOn(testAsset, 'update').andCallThrough();
      testAsset.render(selection);
      root = testAsset.root();
      useEl = root.select('use');
    });

    it('adds all convenience functions', function() {
      expect(testAsset)
        .toHaveProperties('cid', 'target', 'cssClass', 'assetId');
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
        expect(root.node()).toHaveClasses('gl-component', 'gl-asset');
      });

      it('calls update', function() {
        expect(testAsset.update).toHaveBeenCalledOnce();
      });

      it('appends a <use>', function() {
        expect(useEl).not.toBeNull();
      });

    });

    describe('update()', function() {

      it('updates the css class', function() {
        testAsset.cssClass('my-class').update();
        expect(testAsset.cssClass()).toBe('my-class');
        expect(root.node()).toHaveClasses('my-class');
      });

      it('updates the cid', function() {
        testAsset.cid('my-cid').update();
        expect(testAsset.cid()).toBe('my-cid');
        expect(root.node()).toHaveAttr('gl-cid', 'my-cid');
      });

      it('adds a css class for the asset id', function() {
        testAsset.assetId('my-asset-id').update();
        useEl = root.select('use');
        expect(useEl.node()).toHaveClasses('my-asset-id');
      });

      it('updates the asset id', function() {
        testAsset.assetId('my-asset-id').update();
        useEl = root.select('use');
        expect(testAsset.assetId()).toBe('my-asset-id');
        expect(useEl.node()).toHaveAttr('href', '#my-asset-id');
      });

    });

    describe('destroy()', function() {

      beforeEach(function() {
        testAsset.destroy();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
