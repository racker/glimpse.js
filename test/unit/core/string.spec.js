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

    describe('classes()', function () {

      it('handles empty input', function () {
        expect(string.classes('')).toBe('');
      });

      it('handles a single string as input', function () {
        expect(string.classes('classA')).toBe('gl-classA');
      });

      it('handles two strings as input', function () {
        expect(string.classes('classA', 'classB'))
          .toEqual('gl-classA gl-classB');
      });

      it('handles greater than three arguments', function () {
        expect(string.classes('classA', 'classB', 'classC', 'classD'))
          .toEqual('gl-classA gl-classB gl-classC gl-classD');
      });

    });

    describe('startsWith()', function() {

      it('returns true if the string starts with given char', function() {
        expect(string.startsWith('abc', 'a')).toBe(true);
      });

      it('returns false if string doesnt start with given char', function() {
        expect(string.startsWith('abc', 'z')).toBe(false);
      });

      it('returns false if the string is empty', function() {
        expect(string.startsWith('', 'z')).toBe(false);
      });

      it('returns true if the prefix is empty string', function() {
        expect(string.startsWith('abc', '')).toBe(true);
      });

      it('returns false if the prefix is null', function() {
        expect(string.startsWith('abc', null)).toBe(false);
      });

      it('returns false if the prefix is undefined', function() {
        expect(string.startsWith('abc', undefined)).toBe(false);
      });

      it('returns false if the string is undefined', function() {
        expect(string.startsWith(undefined, 'a')).toBe(false);
      });

      it('returns false if the string is null', function() {
        expect(string.startsWith(null, 'a')).toBe(false);
      });

    });


  });

});
