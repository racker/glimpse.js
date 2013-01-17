define([
  'core/string'
],
function (string) {
  'use strict';

  describe('core.string', function () {

    describe('random()', function () {

      it('generates 12 character strings', function () {
        expect(string.random().length).toBe(12);
      });

      it('generates different strings', function () {
        var a = string.random(),
          b = string.random();
        expect(a).not.toEqual(b);
      });

    });

  });

});
