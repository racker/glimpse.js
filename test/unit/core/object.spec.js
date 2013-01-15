define([
  'core/object'
],
function (Obj) {
  'use strict';

  describe('core.obj', function () {

    describe('extend()', function () {
      var target, src1, src2;

      beforeEach(function () {
        target = { a: 'b' };
        src1 = { c: 'd' };
        src2 = { e: 'f' };
      });

      it('returns the target', function () {
        expect(Obj.extend(target)).toEqual(target);
      });

      it('leaves the target in tact if no sources', function () {
        Obj.extend(target);
        expect(Object.keys(target)).toEqual(['a']);
      });

      it('copies the 1st src to the target', function () {
        var expected = { a: 'b', c: 'd' };
        Obj.extend(target, src1);
        expect(target).toEqual(expected);
      });

      it('copies the 1st and 2nd src to the target', function () {
        var expected = { a: 'b', c: 'd', e: 'f' };
        Obj.extend(target, src1, src2);
        expect(target).toEqual(expected);
      });

    });

  });

});
