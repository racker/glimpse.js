define([
  'core/core'
],
function (core) {
  'use strict';

  describe('core.core', function () {
    it('should have a version', function () {
      expect(core.version).toBeDefined();
    });
  });

});
