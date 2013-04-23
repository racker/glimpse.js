define([
  'core/set'
],
function (set) {
  'use strict';

  describe('core.set', function () {

    var testSet;

    beforeEach(function() {
      testSet = set.create();
    });

    describe('.create()', function() {

      it('creates a new set', function() {
        expect(testSet).toBeDefined();
      });

      it('initializes the set with an element', function() {
        testSet = set.create('hello');
        expect(testSet.toArray()).toEqual(['hello']);
      });

      it('initializes the set with elements', function() {
        testSet = set.create(['hello', 'bye']);
        expect(testSet.toArray()).toEqual(['hello', 'bye']);
      });

    });

    describe('add()', function() {

      it('adds an element to the set', function() {
        testSet.add('hello');
        expect(testSet.toArray()).toEqual(['hello']);
      });

      it('adds elements to the set', function() {
        testSet.add(['hello', 'bye']);
        expect(testSet.toArray()).toEqual(['hello', 'bye']);
      });

      it('duplicate elements are not added to the set', function() {
        testSet.add(['hello', 'bye']);
        testSet.add(['bye', 'zebra']);
        expect(testSet.toArray()).toEqual(['hello', 'bye', 'zebra']);
      });

    });

    describe('remove()', function() {

      beforeEach(function() {
        testSet.add(['abc', 'def', 'ghi']);
      });

      it('removes an element from the set', function() {
        testSet.remove('def');
        expect(testSet.toArray()).toEqual(['abc', 'ghi']);
        testSet.remove('ghi');
        expect(testSet.toArray()).toEqual(['abc']);
        testSet.remove('abc');
        expect(testSet.toArray()).toEqual([]);
      });

      it('removes elements from the set', function() {
        testSet.remove(['abc', 'ghi']);
        expect(testSet.toArray()).toEqual(['def']);
      });

      it('no-op on removing non-existent elements', function() {
        testSet.remove(['hello', 'bye']);
        expect(testSet.toArray()).toEqual(['abc', 'def', 'ghi']);
      });

    });

    describe('isEmpty()', function() {

      beforeEach(function() {
        testSet = set.create();
      });

      it('returns true on empty set', function() {
        expect(testSet.isEmpty()).toBe(true);
      });

      it('returns false on empty set', function() {
        testSet.add('test');
        expect(testSet.isEmpty()).not.toBe(true);
      });

      it('handles changes correctly', function() {
        testSet.add('test');
        expect(testSet.isEmpty()).not.toBe(true);
        testSet.remove('test');
        expect(testSet.isEmpty()).toBe(true);
      });

    });

    describe('contains()', function() {

      beforeEach(function() {
        testSet.add(['USA', 'Canada', 'Mexico']);
      });

      it('returns true for valid elements', function() {
        expect(testSet.contains('USA')).toBe(true);
        expect(testSet.contains('Canada')).toBe(true);
        expect(testSet.contains('Mexico')).toBe(true);
      });

      it('returns true for valid array of elements', function() {
        expect(testSet.contains(['USA', 'Canada', 'Mexico'])).toBe(true);
        expect(testSet.contains(['USA', 'Mexico'])).toBe(true);
        expect(testSet.contains(['Canada', 'Mexico'])).toBe(true);
        expect(testSet.contains(['USA', 'Canada'])).toBe(true);
      });

      it('returns false for elements that are not in the set', function() {
        expect(testSet.contains('Brazil')).toBe(false);
        expect(testSet.contains('Germany')).toBe(false);
        expect(testSet.contains('Spain')).toBe(false);
      });

      it('returns false if any item in the array is not in set', function() {
        expect(testSet.contains(['USA', 'Spain', 'Mexico'])).toBe(false);
        expect(testSet.contains(['USA', 'Germany'])).toBe(false);
        expect(testSet.contains(['Brazil', 'Canada'])).toBe(false);
      });

    });

    describe('toggle()', function() {

      beforeEach(function() {
        testSet.add(['USA', 'Canada', 'Mexico']);
      });

      it('toggles one element resulting in removal', function() {
        testSet.toggle('USA');
        expect(testSet.toArray()).toEqual(['Canada', 'Mexico']);
      });

      it('toggles multiple elements resulting in removal', function() {
        testSet.toggle(['USA', 'Mexico']);
        expect(testSet.toArray()).toEqual(['Canada']);
      });

      it('toggles one element resulting in addition', function() {
        testSet.toggle('Zambia');
        expect(testSet.toArray())
          .toEqual(['USA', 'Canada', 'Mexico', 'Zambia']);
      });

      it('toggles multiple elements resulting in additon', function() {
        testSet.toggle(['Spain', 'Zambia']);
        expect(testSet.toArray())
          .toEqual(['USA', 'Canada', 'Mexico', 'Spain', 'Zambia']);
      });

      it('toggles multiple elements resulting in addition & removal',
         function() {
          testSet.toggle(['USA', 'Spain']);
          expect(testSet.toArray()).toEqual(['Canada', 'Mexico', 'Spain']);
         }
      );



    });

  });

});
