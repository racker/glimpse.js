define([
  'components/mixins'
],
function (mixins) {
  'use strict';

  describe('components.mixins', function () {

    describe('mixins.toggle', function () {
      var selection, root, component;

      beforeEach(function () {
        selection = jasmine.svgFixture();
        root = d3.select('#svg-fixture').append('g')
          .attr({
            'class': 'gl-component'
          });
        component = {
          root: function () {
            return root;
          }
        };
        component.show = mixins.toggle.show;
        component.hide = mixins.toggle.hide;
      });

      it('hide()', function () {
        component.hide();
        expect(d3.select('.gl-component').node())
          .toHaveAttr('display', 'none');
      });

      it('show()', function () {
        component.hide();
        component.show();
        expect(d3.select('.gl-component').node())
          .not.toHaveAttr('display');
      });

    });

  });

});
