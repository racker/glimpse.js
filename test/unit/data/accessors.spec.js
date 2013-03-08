define([
  'data/accessors'
], function (accessors) {
  'use strict';

  describe('data accessors', function () {

    beforeEach(function() {
      accessors.clear();
    });

    describe('.get()', function() {

      it('returns the input if input is a function', function() {
        var input = function() { return 'hi'; };
        expect(accessors.get(input)).toBe(input);
      });

      it('returns function if input is a string', function() {
        expect(typeof accessors.get('x')).toBe('function');
        expect(typeof accessors.get('y')).toBe('function');
        expect(typeof accessors.get('z')).toBe('function');
        expect(typeof accessors.get('a.x')).toBe('function');
        expect(typeof accessors.get('b.y')).toBe('function');
        expect(typeof accessors.get('c.b.c')).toBe('function');
      });

      it('caches function for use in subsequent calls', function() {
        var x1 = accessors.get('x'),
            x2 = accessors.get('x'),
            x3 = accessors.get('x');
        expect(x1).toBe(x2);
        expect(x3).toBe(x2);
      });

      it('creates correct accessor function: latency', function() {
        var obj = {'latency': 100},
            accessorFn = accessors.get('latency');
        expect(accessorFn(obj)).toBe(100);
      });

      it('creates correct accessor function: dc.latency', function() {
        var obj = { dc: {'latency': 100} },
            accessorFn = accessors.get('dc.latency');
        expect(accessorFn(obj)).toBe(100);
      });

      it('creates correct accessor function: a.b.c', function() {
        var obj = { a: { b: { c: 100 } } },
            accessorFn = accessors.get('a.b.c');
        expect(accessorFn(obj)).toBe(100);
      });

      it('creates correct accessor function: a.b.c', function() {
        var obj = { a: { b: { c: 100 } } },
            accessorFn = accessors.get('a.b.c');
        expect(accessorFn(obj)).toBe(100);
      });

      it('returns null if path is invalid', function() {
        var obj = { time: 'today' },
            accessorFn1 = accessors.get('latency'),
            accessorFn2 = accessors.get('dc.time'),
            accessorFn3 = accessors.get('x.y.z');
        expect(accessorFn1(obj)).toBe(null);
        expect(accessorFn2(obj)).toBe(null);
        expect(accessorFn3(obj)).toBe(null);
      });

    });

    describe('.clear()', function() {

      it('invalidates the cache', function() {
        var x1 = accessors.get('x'),
            x2 = accessors.get('x'),
            x3;
        expect(x1).toBe(x2);
        accessors.clear();
        x3 = accessors.get('x');
        expect(x3).not.toBe(x1);
        expect(x3).not.toBe(x2);
      });

    });

  });

});
