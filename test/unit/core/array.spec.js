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

  });

});
