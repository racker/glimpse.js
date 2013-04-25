define([
  'components/asset'
],
function(asset) {
  'use strict';

  describe('components.asset', function() {
    var testAsset, selection, root, useEl, handlerSpy;

    beforeEach(function() {
      selection = jasmine.svgFixture();
      testAsset = asset();
      spyOn(testAsset, 'update').andCallThrough();
      handlerSpy = jasmine.createSpy();
    });

    it('adds all convenience functions', function() {
      expect(testAsset)
        .toHaveProperties(
          'cid',
          'target',
          'cssClass',
          'assetId',
          'rootId'
        );
    });

    describe('root()', function() {

      beforeEach(function() {
        testAsset.render(selection);
        root = testAsset.root();
      });

      it('gets the root element', function() {
        var firstChild = selection.node().firstChild;
        expect(root.node()).toBe(firstChild);
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        testAsset.dispatch.on('render', handlerSpy);
        testAsset.render(selection);
        root = testAsset.root();
        useEl = root.select('use');
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

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

      beforeEach(function() {
        testAsset.dispatch.on('update', handlerSpy);
        testAsset.render(selection);
        root = testAsset.root();
        useEl = root.select('use');
      });

      it('dispatches an "update" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

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
        testAsset.dispatch.on('destroy', handlerSpy);
        testAsset.render(selection);
        testAsset.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all child nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
