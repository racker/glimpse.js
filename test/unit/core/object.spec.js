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

    describe('isDef()', function() {

      it('returns true on null', function() {
        expect(Obj.isDef(null)).toBe(true);
      });

      it('returns true on an object', function() {
        expect(Obj.isDef({})).toBe(true);
        expect(Obj.isDef({hello: 'hi'})).toBe(true);
      });

      it('returns true on an array', function() {
        expect(Obj.isDef([])).toBe(true);
        expect(Obj.isDef([null])).toBe(true);
        expect(Obj.isDef([1,2, 3])).toBe(true);
      });

      it('returns true on a strings', function() {
        expect(Obj.isDef('')).toBe(true);
        expect(Obj.isDef('asdasd')).toBe(true);
      });

      it('returns true on a functions', function() {
        expect(Obj.isDef(function() {})).toBe(true);
        expect(Obj.isDef(function() { return ''; })).toBe(true);
      });

      it('returns true on a regular expressions', function() {
        expect(Obj.isDef(/asdasd/)).toBe(true);
        expect(Obj.isDef(/hello/gi)).toBe(true);
      });

      it('returns false on undefined variables', function() {
        var a, b;
        b = undefined;
        expect(Obj.isDef(a)).toBe(false);
        expect(Obj.isDef(b)).toBe(false);
      });

    });

    describe('isDefAndNotNull()', function() {

      it('returns false on null', function() {
        expect(Obj.isDefAndNotNull(null)).toBe(false);
      });

      it('returns true on an object', function() {
        expect(Obj.isDefAndNotNull({})).toBe(true);
        expect(Obj.isDefAndNotNull({hello: 'hi'})).toBe(true);
      });

      it('returns true on an array', function() {
        expect(Obj.isDefAndNotNull([])).toBe(true);
        expect(Obj.isDefAndNotNull([null])).toBe(true);
        expect(Obj.isDefAndNotNull([1,2, 3])).toBe(true);
      });

      it('returns true on a strings', function() {
        expect(Obj.isDefAndNotNull('')).toBe(true);
        expect(Obj.isDefAndNotNull('asdasd')).toBe(true);
      });

      it('returns true on a functions', function() {
        expect(Obj.isDefAndNotNull(function() {})).toBe(true);
        expect(Obj.isDefAndNotNull(function() { return ''; })).toBe(true);
      });

      it('returns true on a regular expressions', function() {
        expect(Obj.isDefAndNotNull(/asdasd/)).toBe(true);
        expect(Obj.isDefAndNotNull(/hello/gi)).toBe(true);
      });

      it('returns false on undefined variables', function() {
        var a, b;
        b = undefined;
        expect(Obj.isDefAndNotNull(a)).toBe(false);
        expect(Obj.isDefAndNotNull(b)).toBe(false);
      });

    });

    describe('.get()', function() {

      var obj;

      it('returns value if string is specified', function() {
        obj = { 'hi': 'bye' };
        expect(Obj.get(obj, 'hi')).toBe('bye');
      });

      it('returns null if non-existent key is specified', function() {
        obj = { 'hi': 'bye' };
        expect(Obj.get(obj, 'hello')).toBe(null);
      });

      it('returns value if path array is specified', function() {
        obj = { 'hi': 'bye' };
        expect(Obj.get(obj, ['hi'])).toBe('bye');
      });

      it('returns null if non-existent path array is specified', function() {
        obj = { 'hi': 'bye' };
        expect(Obj.get(obj, ['hello'])).toBe(null);
      });

      it('returns value if deep path array is specified', function() {
        obj = { 'a': { b: { c: 'howdy'}}  };
        expect(Obj.get(obj, ['a', 'b', 'c'])).toBe('howdy');
      });

      it('returns null if invalid deep path array is specified', function() {
        obj = { 'a': { b: { c: 'howdy'}}  };
        expect(Obj.get(obj, ['a', 'x', 'y'])).toBe(null);
      });

      it('returns the value even if its falsy', function() {
        obj = { 'a': { b: 0 }  };
        expect(Obj.get(obj, ['a', 'b'])).toBe(0);
      });

    });

    describe('override()', function() {
      var baseObj, overrides, suprSpy;

      beforeEach(function() {
        suprSpy = jasmine.createSpy();
        baseObj = {
          bar: 100,
          foo: function(arg) {
            var val = arg + 1;
            this.bar += val;
            suprSpy();
            return val;
          }
        };
        overrides = {
          nonSuprFoo:  function(supr, arg) {
            return arg + 2;
          },
          suprFoo: function(supr, arg) {
            var val = supr(arg + 3);
            this.bar += 1;
            return val;
          }
        };
        spyOn(overrides, 'nonSuprFoo').andCallThrough();
        spyOn(overrides, 'suprFoo').andCallThrough();
      });

      it('does a simple override of the original method', function() {
        Obj.override(baseObj, 'foo', overrides.nonSuprFoo);
        expect(baseObj.foo(1)).toBe(3);
        expect(suprSpy).not.toHaveBeenCalled();
        expect(overrides.nonSuprFoo).toHaveBeenCalled();
        expect(baseObj.bar).toBe(100);
      });

      it('overrides the original method and provides a supr()', function() {
        Obj.override(baseObj, 'foo', overrides.suprFoo);
        expect(baseObj.foo(1)).toBe(5);
        expect(suprSpy).toHaveBeenCalledOnce();
        expect(overrides.suprFoo).toHaveBeenCalledOnce();
      });

      it('provides the correct "this" context', function() {
        Obj.override(baseObj, 'foo', overrides.suprFoo);
        baseObj.foo(1);
        expect(baseObj.bar).toBe(106);
      });

    });

  });

});
