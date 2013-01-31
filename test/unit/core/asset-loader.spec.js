define([
  'core/asset-loader'
],
function (assetLoader) {
  'use strict';

  describe('core.asset-loader', function() {
    var selection;

    beforeEach(function() {
      assetLoader.loadAll();
      selection = d3.select('body > #gl-global-assets');
    });

    describe('loadAll()', function() {

      it('adds a the main dom node to the body', function() {
        expect(selection).toBeSelectionLength(1);
      });

      it('doesnt duplicate the element after multiple calls', function() {
        assetLoader.loadAll();
        expect(selection).toBeSelectionLength(1);
      });

      it('renders the element as hidden', function() {
        expect(selection.node()).toHaveStyle('display', 'none');
      });

      it('renders the element with zero width', function() {
        expect(selection.node()).toHaveStyle('width', '0px');
      });

      it('renders the element with zero height', function() {
        expect(selection.node()).toHaveStyle('height', '0px');
      });

      it('adds the main svg element', function() {
        selection = d3.selectAll('body > #gl-global-assets > svg');
        expect(selection).toBeSelectionLength(1);
      });

      it('adds main svg defs', function() {
        selection = d3.selectAll('body > #gl-global-assets > svg > defs');
        expect(selection).toBeSelectionLength(1);
      });

    });

    describe('removeAll()', function() {
      var node;

      beforeEach(function() {
        assetLoader.removeAll();
        node = document.body.querySelector('body > #gl-global-assets');
      });

      it('removes the div element', function() {
        expect(node).toBeNull();
      });

    });

  });

});
