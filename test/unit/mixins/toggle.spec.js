define([
  'mixins/mixins'
],
function(mixins) {
  'use strict';

  describe('mixins.toggle', function() {
    var selection, root, component, handlerSpy;

    beforeEach(function() {
      handlerSpy = jasmine.createSpy();
      selection = jasmine.svgFixture();
      root = d3.select('#svg-fixture').append('g')
        .attr({
          'class': 'gl-component'
        });
      component = {
        root: function() {
          return root;
        },
        dispatch: d3.dispatch('hide', 'show')
      };
      component.show = mixins.toggle.show;
      component.hide = mixins.toggle.hide;
    });

    describe('.hide()', function() {

      beforeEach(function() {
        component.dispatch.on('hide', handlerSpy);
        component.hide();
      });

      it('dispatches a "hide" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('hides with the display attr', function() {
        expect(d3.select('.gl-component').node())
          .toHaveAttr('display', 'none');
      });

    });

    describe('.show()', function() {

      beforeEach(function() {
        component.dispatch.on('show', handlerSpy);
        component.hide();
        component.show();
      });

      it('dispatches a "show" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('shows with the display attr', function() {
        expect(d3.select('.gl-component').node())
          .not.toHaveAttr('display');
      });

    });

  });

});
