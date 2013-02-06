define([
  'core/function'
],
function (fn) {
  'use strict';

  function sum(a, b, c, d) {
    return a + b + c + d;
  }

  describe('core.function', function () {

    describe('partial()', function () {

      var partial1, partial2, partial3;

      beforeEach(function() {
        partial1 = fn.partial(sum, 100);
        partial2 = fn.partial(sum, 100, 200, 300);
        partial3 = fn.partial(sum, 'hello', 'world');
      });

      it('correctly generates partial for sum - test 1', function () {
        expect(partial1(1, 2, 3)).toBe(106);
        expect(partial1(-1, -2, 3)).toBe(100);
        expect(partial1(-100, 0, 0)).toBe(0);
      });

      it('correctly generates partial for sum - test 2', function () {
        expect(partial2(0)).toBe(600);
        expect(partial2(100, -Infinity)).toBe(700);
        expect(partial2(-600, 20, 30)).toBe(0);
      });

      it('correctly generates partial for sum - test 3', function () {
        expect(partial3(1, 2)).toBe('helloworld12');
        expect(partial3('goodbye', 'world')).toBe('helloworldgoodbyeworld');
      });

    });

  });

});
