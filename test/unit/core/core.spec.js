define([
  'core/core'
],
function (core) {
  'use strict';

  describe('core.core', function () {
    it('should have a version', function () {
      expect(core.version).toBeDefined();
    });

    it('should have components loaded', function () {
      expect(core.components).toBeDefined();
    });

    it('should have data collection exposed', function () {
      expect(core.dataCollection).toBeDefined();
    });
  });

});
