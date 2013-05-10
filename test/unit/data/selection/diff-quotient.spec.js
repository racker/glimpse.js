define([
  'data/collection'
],
function (dc) {
  'use strict';

  var dataCollection;

  describe('difference quotient', function () {

    var sampleData = [
      {'time':1046505600000, 'transfer':10678000},
      {'time':1046592000000, 'transfer':56849000},
      {'time':1046678400000, 'transfer':12634000},
      {'time':1046764800000, 'transfer':19745000},
      {'time':1046851200000, 'transfer':13432000},
      {'time':1046937600000, 'transfer':11428000},
      {'time':1047024000000, 'transfer':77970000},
      {'time':1047110400000, 'transfer':74220000},
      {'time':1047196800000, 'transfer':12423000},
      {'time':1047283200000, 'transfer':88830000},
      {'time':1047369600000, 'transfer':12632000},
      {'time':1047456000000, 'transfer':11675000},
      {'time':1047542400000, 'transfer':10900000}
    ];

    beforeEach(function() {
      dataCollection = dc.create();
      dataCollection.add({
        id: 'transferOrd',
        title: 'Time to Connect (ORD)',
        data: sampleData,
        dimensions: {
          x: function (d) { return d.time; },
          y: function (d) { return d.transfer; }
        }
      });
    });

    function addRoCDerivedSource(interval) {
      dataCollection.add({
        id: 'diffQ',
        title: 'Rate of Change',
        sources: 'transferOrd',
        derivation: function(sources) {
          return sources.diffQuotient({ interval: interval })
                        .dim('y').round().get();
        }
      });
      dataCollection.updateDerivations();

    }

    describe('interval - day', function() {

      it('returns data series with the first point missing', function () {
        addRoCDerivedSource('day');
        expect(sampleData.length).toBe(13);
        expect(dataCollection.get('diffQ').length).toBe(12);
      });

      it('calculates difference quotient', function() {
        addRoCDerivedSource('day');

        expect(dataCollection.get('diffQ'))
          .toEqual([46171000, -44215000, 7111000, -6313000,
                   -2004000, 66542000, -3750000, -61797000,
                   76407000, -76198000, -957000, -775000]);
      });

    });

    describe('interval - hour', function() {

      it('returns data series with the first point missing', function () {
        addRoCDerivedSource('hour');
        expect(sampleData.length).toBe(13);
        expect(dataCollection.get('diffQ').length).toBe(12);
      });

      it('calculates difference quotient', function() {
        addRoCDerivedSource('hour');

        expect(dataCollection.get('diffQ'))
          .toEqual([1923792, -1842292, 296292, -263042, -83500,
                     2772583, -156250, -2574875, 3183625,
                     -3174917, -39875, -32292]);
      });

    });

    describe('interval - minute', function() {

      it('returns data series with the first point missing', function () {
        addRoCDerivedSource('minute');
        expect(sampleData.length).toBe(13);
        expect(dataCollection.get('diffQ').length).toBe(12);
      });

      it('calculates difference quotient', function() {
        addRoCDerivedSource('minute');

        expect(dataCollection.get('diffQ'))
          .toEqual([32063, -30705, 4938, -4384, -1392, 46210,
                   -2604, -42915, 53060, -52915, -665, -538]);
      });

    });

    describe('interval - second', function() {

      it('returns data series with the first point missing', function () {
        addRoCDerivedSource('second');
        expect(sampleData.length).toBe(13);
        expect(dataCollection.get('diffQ').length).toBe(12);
      });

      it('calculates difference quotient', function() {
        addRoCDerivedSource('second');

        expect(dataCollection.get('diffQ'))
          .toEqual([534,-512,82,-73,-23,770,-43,-715,884,-882,-11,-9]);
      });

    });

  });

});
