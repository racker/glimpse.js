define([
  'layout/layouts'
],
function (layouts) {
  'use strict';

  describe('layout.layouts', function () {

    it('is defined', function () {
      expect(layouts).toBeDefined();
    });

    it('gets all layouts', function () {
      var l = layouts.getLayouts();
      expect(Object.keys(l)).toEqual(['default', 'sparkline','threepane']);
    });

    it('has a default layout', function () {
      expect(layouts.getLayout('default')).toBeDefined();
      expect(layouts.getLayouts()['default']).toBeDefined();
    });

    it('sets and removes layout', function () {
      var newLayout = {'class':'testlayout'};
      layouts.setLayout('new1', newLayout);
      expect(layouts.getLayout('new1')).toBe(newLayout);
      layouts.removeLayout('new1');
      expect(layouts.getLayout('new1')).not.toBe(newLayout);
    });

    it('sets and gets new layout', function () {
      var newLayout = {'class':'testlayout'};
      layouts.setLayout('new2', newLayout);
      expect(layouts.getLayout('new2')).toBe(newLayout);
      //Clean up
      layouts.removeLayout('new2');
    });

  });

});
