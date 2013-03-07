define([
  'data/collection'
],
function (dc) {
  'use strict';

  var dataCollection;

  describe('difference quotient', function () {

    var sampleData = [
      {'time':1046505600000, 'latency':106},
      {'time':1046592000000,'latency':56},
      {'time':1046678400000,'latency':126},
      {'time':1046764800000,'latency':197},
      {'time':1046851200000,'latency':134},
      {'time':1046937600000,'latency':114},
      {'time':1047024000000,'latency':77},
      {'time':1047110400000,'latency':74},
      {'time':1047196800000,'latency':124},
      {'time':1047283200000,'latency':88},
      {'time':1047369600000,'latency':126},
      {'time':1047456000000,'latency':115},
      {'time':1047542400000,'latency':100}
    ];

    beforeEach(function() {
      dataCollection = dc.create();
      dataCollection.add({
        id: 'latencyOrd',
        title: 'Time to Connect (ORD)',
        data: sampleData,
        dimensions: {
          x: function (d) { return d.time; },
          y: function (d) { return d.latency; }
        }
      });
    });

    function addDerivedSource() {
      dataCollection.add({
        id: 'diffQ',
        title: 'Difference Quotient',
        sources: 'latencyOrd',
        derivation: function(sources) {
          return sources.diffQuotient().dim('y').round().get();
        }
      });
      dataCollection.updateDerivations();

    }

    it('returns data series with the first point missing', function () {
      addDerivedSource();
      expect(sampleData.length).toBe(13);
      expect(dataCollection.get('diffQ').length).toBe(12);
    });

    it('calculates difference quotient', function() {
      addDerivedSource();

      expect(dataCollection.get('diffQ'))
        .toEqual([ -50, 70, 71, -63, -20, -37, -3, 50, -36, 38, -11, -15  ]);
    });

  });

});
