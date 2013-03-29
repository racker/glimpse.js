define([
  'core/array'
],
function (array) {
  'use strict';

  describe('core.array', function () {

    describe('convertArgs()', function () {

      it('returns a real array', function () {
        expect(Array.isArray(array.convertArgs(arguments))).toBe(true);
      });

      it('converts all args with no from index', function () {
        function test() {
          return array.convertArgs(arguments);
        }
        expect(test(1, 2)).toEqual([1, 2]);
      });

      it('converts only from index when specified', function () {
        function test() {
          return array.convertArgs(arguments, 1);
        }
        expect(test(1, 2, 3)).toEqual([2, 3]);
      });

    });

    describe('find()', function () {

      it('returns undefined for an empty array', function () {
        expect(array.find([])).not.toBeDefined();
      });

      it('returns undefined if none are found', function () {
        var findFunc = function (el) {
          return el === 3;
        };
        expect(array.find([1, 2], findFunc)).not.toBeDefined();
      });

      it('returns the element if found', function () {
        var findFunc = function (el) {
          return el === 2;
        };
        expect(array.find([1, 2, 3], findFunc)).toBe(2);
      });

      it('returns the first found element not the second', function () {
        var data = [
          { found: false, val: 1 },
          { found: true, val: 2 },
          { found: true, val: 3 }
        ],
        findFunc = function (el) {
          return el.found;
        };
        expect(array.find(data, findFunc)).toBe(data[1]);
      });

    });

    describe('append()', function () {

      it('appends at the end of the array', function () {
        expect(array.append([1,2], [3,4]).toString()).toBe('1,2,3,4');
      });

    });

    describe('getArray()', function() {

      it('returns an empty array if input is undefined', function() {
        expect(array.getArray()).toEqual([]);
      });

      it('returns an empty array if input is null', function() {
        expect(array.getArray(null)).toEqual([]);
      });

      it('returns array with single object if input is an Object', function() {
        var obj = {'hello': 'bye'};
        expect(array.getArray(obj)).toEqual([obj]);
      });

      it('returns the array if input is an array', function() {
        var arr = [1, 2, 3];
        expect(array.getArray(arr)).toEqual(arr);
      });

    });

    describe('remove()', function() {
      var testArray;

      beforeEach(function() {
        testArray = ['a', 'b', 'c', 'd'];
      });

      it('removes a single element from the array', function() {
        array.remove(testArray, 'b');
        expect(testArray).toEqual(['a', 'c', 'd']);
      });

      it('removes multiple elements from the array', function() {
        array.remove(testArray, ['b', 'd']);
        expect(testArray).toEqual(['a', 'c']);
      });

      it('ignores non-existing elements', function() {
        array.remove(testArray, ['a', 'z']);
        expect(testArray).toEqual(['b', 'c', 'd']);
      });

      it('returns only the removed elements', function() {
        expect(array.remove(testArray, ['a', 'z']))
          .toEqual(['a']);
      });

    });

    describe('contains()', function() {
      var testArray;

      beforeEach(function() {
        testArray = ['a', 'b', 'c'];
      });

      it('returns false for an empty array', function() {
        expect(array.contains([], 'z')).toBe(false);
      });

      it('returns false for a non-array', function() {
        expect(array.contains(null, 'z')).toBe(false);
      });

      it('returns true if item is in the array', function() {
        expect(array.contains(testArray, 'a')).toBe(true);
      });

      it('returns false if item is not in the array', function() {
        expect(array.contains(testArray, 'z')).toBe(false);
      });

      it('returns true if an object is in the array', function() {
        var obj = { foo: 'bar' };
        expect(array.contains([obj], obj)).toBe(true);
      });

      it('returns false if the object is similar but not the same.',
      function() {
        var obj = { foo: 'bar' };
        expect(array.contains([{ foo: 'bar' }], obj)).toBe(false);
      });

    });
  });

});
