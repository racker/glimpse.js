define([
  'core/string'
],
function (string) {
  'use strict';

  describe('core.string', function () {

    describe('random()', function () {

      it('generates at least 8 character strings', function () {
        expect(string.random().length > 8).toBe(true);
      });

      it('generates different strings', function () {
        var a = string.random(),
          b = string.random();
        expect(a).not.toEqual(b);
      });

    });

  });

});
