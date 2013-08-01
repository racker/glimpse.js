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

    describe('compose()', function() {

      var a, b, c;

      beforeEach(function() {
        a = 0;
        b = 0;
        c = 0;
      });

      it('composes a single function', function() {
        var singleComp = fn.compose(function() { a = 1000; });
        singleComp();
        expect(a).toBe(1000);
      });

      it('composes two function together', function() {
        var dualComp = fn.compose(function() { a = 1000; },
          function() { b = 2000; });
        dualComp();
        expect(a).toBe(1000);
        expect(b).toBe(2000);
      });

      it('executes left most function arguments last', function() {
        var dualComp = fn.compose(function() { a = 1000; },
          function() { a = 2000; });
        dualComp();
        expect(a).toBe(1000);
      });

      it('it composes functions by passing inputs correctly', function() {
        var dualComp = fn.compose(function(i) { a = i; },
          function() { return 2000; });
        dualComp();
        expect(a).toBe(2000);
      });

      it('composes three functions', function() {
        var triComp = fn.compose(function() { a = 1000; },
          function() { b = 2000; }, function() { c = 3000; });
        triComp();
        expect(a).toBe(1000);
        expect(b).toBe(2000);
        expect(c).toBe(3000);
      });

    });

  });

});
